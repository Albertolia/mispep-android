package com.mispep.es;

import android.app.Activity;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.ContentResolver;
import android.content.ContentUris;
import android.content.ContentValues;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.AlarmClock;
import android.provider.MediaStore;
import android.provider.Settings;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;
import android.view.Window;
import android.view.WindowManager;
import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends Activity {
    private WebView webView;
    private static final String CHANNEL_ID = "mispep_doses";
    private static final int FILE_CHOOSER_REQUEST = 2001;
    private android.webkit.ValueCallback<Uri[]> pendingFileChooser;

    public static class SuccessRunnable implements Runnable {
        private final Context ctx;
        private final Uri uri;
        private final boolean share;

        public SuccessRunnable(Context c, Uri u, boolean s) {
            this.ctx = c;
            this.uri = u;
            this.share = s;
        }

        @Override
        public void run() {
            Toast.makeText(ctx, "✓ Etiqueta guardada en Galería", Toast.LENGTH_SHORT).show();
            if (share && uri != null) {
                try {
                    Intent intent = new Intent(Intent.ACTION_SEND);
                    intent.setType("image/png");
                    intent.putExtra(Intent.EXTRA_STREAM, uri);
                    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                    ctx.startActivity(Intent.createChooser(intent, "Compartir o Imprimir Etiqueta"));
                } catch (Exception ex) {
                    Toast.makeText(ctx, "No se pudo abrir menú de impresión: " + ex.getMessage(), Toast.LENGTH_SHORT).show();
                }
            }
        }
    }

    public static class MisPepChromeClient extends WebChromeClient {
        private final MainActivity activity;

        public MisPepChromeClient(MainActivity a) {
            this.activity = a;
        }

        @Override
        public boolean onShowFileChooser(WebView view,
                                         android.webkit.ValueCallback<Uri[]> filePathCallback,
                                         FileChooserParams fileChooserParams) {
            // Sin esto el selector de ficheros del WebView nunca se abre
            // (la restauración de copias de seguridad JSON no funcionaría)
            return activity.openFileChooser(filePathCallback, fileChooserParams);
        }
    }

    public static class ToastRunnable implements Runnable {
        private final Context ctx;
        private final String msg;

        public ToastRunnable(Context c, String m) {
            this.ctx = c;
            this.msg = m;
        }

        @Override
        public void run() {
            Toast.makeText(ctx, msg, Toast.LENGTH_LONG).show();
        }
    }

    public static class ErrorRunnable implements Runnable {
        private final Context ctx;
        private final String message;

        public ErrorRunnable(Context c, String m) {
            this.ctx = c;
            this.message = m;
        }

        @Override
        public void run() {
            Toast.makeText(ctx, "Error: " + message, Toast.LENGTH_LONG).show();
        }
    }

    public static class FinishActivityRunnable implements Runnable {
        private final Activity act;

        public FinishActivityRunnable(Activity a) {
            this.act = a;
        }

        @Override
        public void run() {
            if (act != null && !act.isFinishing()) {
                act.finish();
            }
        }
    }

    public static class SendNotificationRunnable implements Runnable {
        private final MainActivity act;
        private final String title;
        private final String message;

        public SendNotificationRunnable(MainActivity a, String t, String m) {
            this.act = a;
            this.title = t;
            this.message = m;
        }

        @Override
        public void run() {
            act.showNotification(title, message);
        }
    }

    public static class ScheduledNotificationTask implements Runnable {
        private final MainActivity act;
        private final String title;
        private final String message;

        public ScheduledNotificationTask(MainActivity a, String t, String m) {
            this.act = a;
            this.title = t;
            this.message = m;
        }

        @Override
        public void run() {
            act.showNotification(title, message);
        }
    }

    // Tarea para copiar la lista de medicación al portapapeles en el hilo de UI
    public static class CopyClipboardTask implements Runnable {
        private final MainActivity act;
        private final String text;

        public CopyClipboardTask(MainActivity a, String t) {
            this.act = a;
            this.text = t;
        }

        @Override
        public void run() {
            try {
                android.content.ClipboardManager cm =
                        (android.content.ClipboardManager) act.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) {
                    cm.setPrimaryClip(android.content.ClipData.newPlainText("Lista de medicación", text));
                    Toast.makeText(act, "Lista copiada al portapapeles", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    // Tarea para compartir la lista de medicación por cualquier app (WhatsApp, email, etc.)
    public static class ShareTextTask implements Runnable {
        private final MainActivity act;
        private final String text;
        private final String subject;

        public ShareTextTask(MainActivity a, String t, String s) {
            this.act = a;
            this.text = t;
            this.subject = s;
        }

        @Override
        public void run() {
            try {
                Intent send = new Intent(Intent.ACTION_SEND);
                send.setType("text/plain");
                send.putExtra(Intent.EXTRA_SUBJECT, subject == null ? "Lista de medicación" : subject);
                send.putExtra(Intent.EXTRA_TEXT, text);
                Intent chooser = Intent.createChooser(send, "Compartir lista de medicación");
                chooser.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                act.startActivity(chooser);
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    // Tarea para abrir apps de cartera de criptomonedas (bitcoin:, lightning:, litecoin:)
    public static class OpenWalletTask implements Runnable {
        private final MainActivity act;
        private final String uriString;
        private final String fallbackText;

        public OpenWalletTask(MainActivity a, String u, String f) {
            this.act = a;
            this.uriString = u;
            this.fallbackText = f;
        }

        @Override
        public void run() {
            try {
                Uri uri = Uri.parse(uriString);
                Intent intent = new Intent(Intent.ACTION_VIEW, uri);
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                act.startActivity(intent);
            } catch (Exception ex) {
                // Si no hay app de cartera instalada que responda al esquema, copiar dirección y avisar
                try {
                    android.content.ClipboardManager cm =
                            (android.content.ClipboardManager) act.getSystemService(Context.CLIPBOARD_SERVICE);
                    if (cm != null && fallbackText != null) {
                        cm.setPrimaryClip(android.content.ClipData.newPlainText("Dirección Crypto", fallbackText));
                        Toast.makeText(act, "No se detectó cartera. Dirección copiada al portapapeles", Toast.LENGTH_LONG).show();
                    }
                } catch (Exception e2) {
                    e2.printStackTrace();
                }
            }
        }
    }

    // Tarea para copiar dirección de criptomoneda al portapapeles con toast personalizado
    public static class CopyCryptoTask implements Runnable {
        private final MainActivity act;
        private final String text;
        private final String label;

        public CopyCryptoTask(MainActivity a, String t, String l) {
            this.act = a;
            this.text = t;
            this.label = l != null ? l : "Dirección Crypto";
        }

        @Override
        public void run() {
            try {
                android.content.ClipboardManager cm =
                        (android.content.ClipboardManager) act.getSystemService(Context.CLIPBOARD_SERVICE);
                if (cm != null) {
                    cm.setPrimaryClip(android.content.ClipData.newPlainText(label, text));
                    Toast.makeText(act, "✓ " + label + " copiado al portapapeles", Toast.LENGTH_SHORT).show();
                }
            } catch (Exception ex) {
                ex.printStackTrace();
            }
        }
    }

    public static class WebAppInterface {
        private final Context mContext;
        private final Vibrator vibrator;

        public WebAppInterface(Context c) {
            mContext = c;
            vibrator = (Vibrator) c.getSystemService(Context.VIBRATOR_SERVICE);
        }

        @JavascriptInterface
        public void exitApp() {
            if (mContext instanceof Activity) {
                ((Activity) mContext).runOnUiThread(new FinishActivityRunnable((Activity) mContext));
            }
        }

        @JavascriptInterface
        public void haptic(int durationMs) {
            if (vibrator != null && vibrator.hasVibrator()) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                    vibrator.vibrate(VibrationEffect.createOneShot(Math.max(10, durationMs), VibrationEffect.DEFAULT_AMPLITUDE));
                } else {
                    vibrator.vibrate(Math.max(10, durationMs));
                }
            }
        }

        @JavascriptInterface
        public void saveImage(String base64Data, String filename, boolean shareAfterSave) {
            try {
                String cleanBase64 = base64Data;
                if (cleanBase64.contains(",")) {
                    cleanBase64 = cleanBase64.substring(cleanBase64.indexOf(",") + 1);
                }
                byte[] imageBytes = Base64.decode(cleanBase64, Base64.DEFAULT);

                Uri imageUri = null;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    ContentValues values = new ContentValues();
                    values.put(MediaStore.Images.Media.DISPLAY_NAME, filename);
                    values.put(MediaStore.Images.Media.MIME_TYPE, "image/png");
                    values.put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/MisPep");

                    imageUri = mContext.getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values);
                    if (imageUri != null) {
                        OutputStream out = mContext.getContentResolver().openOutputStream(imageUri);
                        if (out != null) {
                            out.write(imageBytes);
                            out.close();
                        }
                    }
                } else {
                    File dir = Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_PICTURES);
                    File appDir = new File(dir, "MisPep");
                    appDir.mkdirs();
                    File file = new File(appDir, filename);
                    FileOutputStream out = new FileOutputStream(file);
                    out.write(imageBytes);
                    out.close();
                    imageUri = Uri.fromFile(file);
                }

                if (mContext instanceof Activity) {
                    ((Activity) mContext).runOnUiThread(new SuccessRunnable(mContext, imageUri, shareAfterSave));
                }

            } catch (Exception e) {
                e.printStackTrace();
                if (mContext instanceof Activity) {
                    ((Activity) mContext).runOnUiThread(new ErrorRunnable(mContext, e.getMessage()));
                }
            }
        }

        @JavascriptInterface
        public void saveTextFile(String filename, String content, String mimeType) {
            String destino = guardarArchivo(filename, content, mimeType);
            if (destino != null && mContext instanceof Activity) {
                ((Activity) mContext).runOnUiThread(new ToastRunnable(mContext, "✓ Guardado en " + destino));
            }
        }

        @JavascriptInterface
        public void saveTextFileSilencioso(String filename, String content, String mimeType) {
            guardarArchivo(filename, content, mimeType);
        }

        private String guardarArchivo(String filename, String content, String mimeType) {
            try {
                String mime = (mimeType == null || mimeType.length() == 0) ? "application/json" : mimeType;
                String destino;

                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                    // Android 10+: MediaStore, sin permisos, visible en Descargas
                    ContentResolver resolver = mContext.getContentResolver();
                    Uri collection = MediaStore.Downloads.EXTERNAL_CONTENT_URI;
                    Uri uri = null;

                    // Si ya existe un archivo con ese nombre, se sobrescribe (necesario para el backup automatico)
                    try {
                        Cursor c = resolver.query(collection, new String[]{MediaStore.Downloads._ID},
                                MediaStore.Downloads.DISPLAY_NAME + "=?", new String[]{filename}, null);
                        if (c != null) {
                            if (c.moveToFirst()) {
                                uri = ContentUris.withAppendedId(collection, c.getLong(0));
                            }
                            c.close();
                        }
                    } catch (Exception ignored) {
                        uri = null;
                    }

                    if (uri != null) {
                        try {
                            OutputStream out = resolver.openOutputStream(uri, "wt");
                            if (out == null) throw new Exception("sin stream");
                            out.write(content.getBytes("UTF-8"));
                            out.flush();
                            out.close();
                        } catch (Exception e) {
                            // no se pudo sobrescribir (propiedad perdida tras reinstalar): se reemplaza
                            try { resolver.delete(uri, null, null); } catch (Exception ignored) {}
                            uri = null;
                        }
                    }

                    if (uri == null) {
                        ContentValues values = new ContentValues();
                        values.put(MediaStore.Downloads.DISPLAY_NAME, filename);
                        values.put(MediaStore.Downloads.MIME_TYPE, mime);
                        values.put(MediaStore.Downloads.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/MisPep");

                        uri = resolver.insert(collection, values);
                        if (uri == null) {
                            throw new Exception("No se pudo crear el archivo en Descargas");
                        }
                        OutputStream out = resolver.openOutputStream(uri);
                        if (out == null) {
                            throw new Exception("No se pudo abrir el archivo para escritura");
                        }
                        out.write(content.getBytes("UTF-8"));
                        out.flush();
                        out.close();
                    }
                    destino = "Descargas/MisPep/" + filename;
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "MisPep");
                    dir.mkdirs();
                    File file = new File(dir, filename);
                    FileOutputStream out = new FileOutputStream(file);
                    out.write(content.getBytes("UTF-8"));
                    out.flush();
                    out.close();
                    destino = file.getAbsolutePath();
                }
                return destino;
            } catch (Exception e) {
                e.printStackTrace();
                return null;
            }
        }

        @JavascriptInterface
        public void notifyDose(String title, String message) {
            if (mContext instanceof Activity) {
                ((Activity) mContext).runOnUiThread(new SendNotificationRunnable((MainActivity) mContext, title, message));
            }
        }

        @JavascriptInterface
        public void scheduleDoseReminder(String title, String message, long delayMs) {
            if (mContext instanceof MainActivity) {
                ((MainActivity) mContext).scheduleNotification(title, message, delayMs);
            }
        }

        @JavascriptInterface
        public void scheduleExactDoseAtTime(String targetDateStr, String timeStr, String title, String message) {
            try {
                SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.getDefault());
                Date date = sdf.parse(targetDateStr);
                if (date == null) return;

                int hour = 9;
                int minute = 0;
                if (timeStr != null) {
                    String t = timeStr.trim().toUpperCase(java.util.Locale.ROOT).replace(".", ":");
                    boolean pm = t.contains("PM");
                    boolean am = t.contains("AM");
                    t = t.replace("AM", "").replace("PM", "").trim();
                    if (t.contains(":")) {
                        String[] parts = t.split(":");
                        try {
                            hour = Integer.parseInt(parts[0].trim());
                            minute = Integer.parseInt(parts[1].trim());
                        } catch (NumberFormatException ignored) {}
                    }
                    if (am && hour == 12) hour = 0;
                    if (pm && hour != 12) hour += 12;
                    if (hour < 0 || hour > 23) hour = 9;
                    if (minute < 0 || minute > 59) minute = 0;
                }

                Calendar cal = Calendar.getInstance();
                cal.setTime(date);
                cal.set(Calendar.HOUR_OF_DAY, hour);
                cal.set(Calendar.MINUTE, minute);
                cal.set(Calendar.SECOND, 0);
                cal.set(Calendar.MILLISECOND, 0);

                long triggerMillis = cal.getTimeInMillis();
                long now = System.currentTimeMillis();

                // Si ya pasó esa hora de ese día, no programar en el pasado
                if (triggerMillis <= now) {
                    return;
                }

                Intent intent = new Intent(mContext, NotificationReceiver.class);
                intent.putExtra("title", title);
                intent.putExtra("message", message);

                int flags = PendingIntent.FLAG_UPDATE_CURRENT;
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    flags |= PendingIntent.FLAG_IMMUTABLE;
                }

                PendingIntent pendingIntent = PendingIntent.getBroadcast(mContext, 9001, intent, flags);
                AlarmManager am = (AlarmManager) mContext.getSystemService(Context.ALARM_SERVICE);
                if (am != null) {
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                        am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMillis, pendingIntent);
                    } else {
                        am.setExact(AlarmManager.RTC_WAKEUP, triggerMillis, pendingIntent);
                    }
                }
            } catch (Exception e) {
                e.printStackTrace();
            }
        }

        @JavascriptInterface
        public void scheduleExactDoseAt9AM(String targetDateStr, String title, String message) {
            scheduleExactDoseAtTime(targetDateStr, "09:00", title, message);
        }

        @JavascriptInterface
        public boolean setSystemClockAlarm(String timeStr, String message, int dayOfWeek) {
            try {
                int hour = 9;
                int minute = 0;
                if (timeStr != null && !timeStr.trim().isEmpty()) {
                    String t = timeStr.trim().replace(".", ":");
                    boolean pm = t.toUpperCase(Locale.ROOT).contains("PM");
                    boolean am = t.toUpperCase(Locale.ROOT).contains("AM");
                    t = t.replaceAll("(?i)[^0-9:]", "").trim();
                    if (t.contains(":")) {
                        String[] p = t.split(":");
                        try {
                            hour = Integer.parseInt(p[0].trim());
                            minute = Integer.parseInt(p[1].trim());
                        } catch (NumberFormatException ignored) {}
                    }
                    if (am && hour == 12) hour = 0;
                    if (pm && hour != 12) hour += 12;
                    if (hour < 0 || hour > 23) hour = 9;
                    if (minute < 0 || minute > 59) minute = 0;
                }

                Intent intent = new Intent(AlarmClock.ACTION_SET_ALARM);
                intent.putExtra(AlarmClock.EXTRA_HOUR, hour);
                intent.putExtra(AlarmClock.EXTRA_MINUTES, minute);
                intent.putExtra(AlarmClock.EXTRA_MESSAGE, message != null && !message.trim().isEmpty() ? message : "💉 Inyección MisPep");
                intent.putExtra(AlarmClock.EXTRA_SKIP_UI, false);

                // Si se indica día de la semana (Calendar.SUNDAY..Calendar.SATURDAY)
                if (dayOfWeek >= Calendar.SUNDAY && dayOfWeek <= Calendar.SATURDAY) {
                    java.util.ArrayList<Integer> days = new java.util.ArrayList<Integer>();
                    days.add(dayOfWeek);
                    intent.putExtra(AlarmClock.EXTRA_DAYS, days);
                }

                intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                mContext.startActivity(intent);
                return true;
            } catch (Exception e) {
                e.printStackTrace();
                return false;
            }
        }

        @JavascriptInterface
        public void openBatterySettings() {
            try {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    Intent intent = new Intent();
                    String packageName = mContext.getPackageName();
                    PowerManager pm = (PowerManager) mContext.getSystemService(Context.POWER_SERVICE);
                    if (pm != null && !pm.isIgnoringBatteryOptimizations(packageName)) {
                        intent.setAction(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                        intent.setData(Uri.parse("package:" + packageName));
                    } else {
                        intent.setAction(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                    }
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(intent);
                } else {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + mContext.getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(intent);
                }
            } catch (Exception e) {
                try {
                    Intent intent = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                    intent.setData(Uri.parse("package:" + mContext.getPackageName()));
                    intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    mContext.startActivity(intent);
                } catch (Exception ex) {
                    ex.printStackTrace();
                }
            }
        }

        @JavascriptInterface
        public boolean isIgnoringBatteryOptimizations() {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                PowerManager pm = (PowerManager) mContext.getSystemService(Context.POWER_SERVICE);
                if (pm != null) {
                    return pm.isIgnoringBatteryOptimizations(mContext.getPackageName());
                }
            }
            return true;
        }

        @JavascriptInterface
        public void copyToClipboard(String text) {
            if (text == null) return;
            if (mContext instanceof MainActivity) {
                ((MainActivity) mContext).runOnUiThread(new CopyClipboardTask((MainActivity) mContext, text));
            }
        }

        @JavascriptInterface
        public void shareText(String text, String subject) {
            if (text == null) return;
            if (mContext instanceof MainActivity) {
                ((MainActivity) mContext).runOnUiThread(new ShareTextTask((MainActivity) mContext, text, subject));
            }
        }

        @JavascriptInterface
        public void openWalletUri(String uriString, String fallbackText) {
            if (uriString == null) return;
            if (mContext instanceof MainActivity) {
                ((MainActivity) mContext).runOnUiThread(new OpenWalletTask((MainActivity) mContext, uriString, fallbackText));
            }
        }

        @JavascriptInterface
        public void copyCryptoAddress(String address, String label) {
            if (address == null) return;
            if (mContext instanceof MainActivity) {
                ((MainActivity) mContext).runOnUiThread(new CopyCryptoTask((MainActivity) mContext, address, label));
            }
        }

        // ---------- Health Connect (pesajes de la bascula) ----------

        @JavascriptInterface
        public boolean hayHealthConnect() {
            boolean r = Build.VERSION.SDK_INT >= 34 && MisPepHealthConnect.disponible(mContext);
            android.util.Log.i("MisPepHC", "JS -> hayHealthConnect = " + r);
            return r;
        }

        @JavascriptInterface
        public boolean tienePermisoPesoHC() {
            boolean r = Build.VERSION.SDK_INT >= 34 && MisPepHealthConnect.tienePermiso(mContext);
            android.util.Log.i("MisPepHC", "JS -> tienePermisoPesoHC = " + r);
            return r;
        }

        @JavascriptInterface
        public boolean tienePermisoPresionHC() {
            boolean r = Build.VERSION.SDK_INT >= 34 && MisPepHealthConnect.tienePermisoPresion(mContext);
            android.util.Log.i("MisPepHC", "JS -> tienePermisoPresionHC = " + r);
            return r;
        }

        @JavascriptInterface
        public void pedirPermisoPesoHC() {
            android.util.Log.i("MisPepHC", "JS -> pedirPermisoPesoHC");
            if (Build.VERSION.SDK_INT < 34) return;
            if (mContext instanceof MainActivity) {
                final MainActivity act = (MainActivity) mContext;
                act.runOnUiThread(new PermisoHCRunnable(act));
            }
        }

        @JavascriptInterface
        public void leerPesosHC(int dias) {
            android.util.Log.i("MisPepHC", "JS -> leerPesosHC " + dias + " dias");
            if (Build.VERSION.SDK_INT < 34) return;
            if (mContext instanceof MainActivity) {
                MisPepHealthConnect.leerPesos((MainActivity) mContext, dias);
            }
        }

        @JavascriptInterface
        public void leerPresionHC(int dias) {
            android.util.Log.i("MisPepHC", "JS -> leerPresionHC " + dias + " dias");
            if (Build.VERSION.SDK_INT < 34) return;
            if (mContext instanceof MainActivity) {
                MisPepHealthConnect.leerPresion((MainActivity) mContext, dias);
            }
        }
    }

    /** Lanza el dialogo de permisos de Health Connect (debe correr en el hilo de interfaz). */
    public static class PermisoHCRunnable implements Runnable {
        private final MainActivity act;

        public PermisoHCRunnable(MainActivity a) {
            this.act = a;
        }

        public void run() {
            MisPepHealthConnect.pedirPermiso(act);
        }
    }

    /** Ejecuta JavaScript en la pagina (siempre en el hilo de interfaz). */
    public static class JsRunnable implements Runnable {
        private final MainActivity act;
        private final String js;

        public JsRunnable(MainActivity a, String codigo) {
            this.act = a;
            this.js = codigo;
        }

        public void run() {
            if (act.webView != null) {
                act.webView.evaluateJavascript(js, null);
            }
        }
    }

    public void enviarAJavaScript(final String js) {
        runOnUiThread(new JsRunnable(this, js));
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        // 4601 = MisPepHealthConnect.PETICION_PERMISO (se repite aqui como numero
        // para no cargar la clase de Health Connect en moviles antiguos)
        if (requestCode == 4601) {
            boolean concedido = grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            enviarAJavaScript("window.mispepPermisoHC && window.mispepPermisoHC(" + (concedido ? "true" : "false") + ")");
        }
    }

    /** Vuelta de la pantalla de permisos de Health Connect (se reconsulta el permiso real). */
    public void resultadoPermisoHealthConnect() {
        boolean concedidoPeso = checkSelfPermission("android.permission.health.READ_WEIGHT") == PackageManager.PERMISSION_GRANTED;
        boolean concedidoBP = checkSelfPermission("android.permission.health.READ_BLOOD_PRESSURE") == PackageManager.PERMISSION_GRANTED;
        boolean concedido = concedidoPeso || concedidoBP;
        enviarAJavaScript("window.mispepPermisoHC && window.mispepPermisoHC(" + (concedido ? "true" : "false") + ")");
    }

    private void createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            CharSequence name = "Recordatorios de Dosis";
            String description = "Avisos programados para administración de péptidos";
            int importance = NotificationManager.IMPORTANCE_HIGH;
            NotificationChannel channel = new NotificationChannel(CHANNEL_ID, name, importance);
            channel.setDescription(description);
            channel.enableVibration(true);
            NotificationManager nm = getSystemService(NotificationManager.class);
            if (nm != null) {
                nm.createNotificationChannel(channel);
            }
        }
    }

    public void showNotification(String title, String message) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                if (checkSelfPermission("android.permission.POST_NOTIFICATIONS") != PackageManager.PERMISSION_GRANTED) {
                    requestPermissions(new String[]{"android.permission.POST_NOTIFICATIONS"}, 101);
                }
            }

            Intent intent = new Intent(this, MainActivity.class);
            intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TASK);
            int flags = PendingIntent.FLAG_UPDATE_CURRENT;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags |= PendingIntent.FLAG_IMMUTABLE;
            }
            PendingIntent pendingIntent = PendingIntent.getActivity(this, 0, intent, flags);

            Notification.Builder builder;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                builder = new Notification.Builder(this, CHANNEL_ID);
            } else {
                builder = new Notification.Builder(this);
            }

            int iconRes = getApplicationInfo().icon != 0 ? getApplicationInfo().icon : android.R.drawable.ic_popup_reminder;
            builder.setContentTitle(title)
                   .setContentText(message)
                   .setSmallIcon(iconRes)
                   .setContentIntent(pendingIntent)
                   .setAutoCancel(true);

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
                builder.setPriority(Notification.PRIORITY_HIGH);
            }

            NotificationManager nm = (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);
            if (nm != null) {
                nm.notify((int) System.currentTimeMillis(), builder.build());
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public void scheduleNotification(String title, String message, long delayMs) {
        new Handler(Looper.getMainLooper()).postDelayed(new ScheduledNotificationTask(this, title, message), Math.max(1000, delayMs));
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            Window window = getWindow();
            window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
            window.setStatusBarColor(0xFF090D16);
        }

        createNotificationChannel();

        WebView.setWebContentsDebuggingEnabled(true);
        webView = new WebView(this);
        WebSettings s = webView.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(true);
        s.setAllowContentAccess(true);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        // Sin zoom por pellizco ni botones de zoom: la app se navega como una app nativa
        s.setSupportZoom(false);
        s.setBuiltInZoomControls(false);
        s.setDisplayZoomControls(false);
        s.setTextZoom(100);
        // Evita el destello blanco entre el arranque y el primer render del WebView
        webView.setBackgroundColor(0xFF090D16);
        webView.setOverScrollMode(View.OVER_SCROLL_NEVER);

        webView.addJavascriptInterface(new WebAppInterface(this), "AndroidBridge");
        webView.addJavascriptInterface(new WebAppInterface(this), "Android");
        webView.setWebChromeClient(new MisPepChromeClient(this));
        webView.setWebViewClient(new WebViewClient());

        setContentView(webView);
        webView.loadUrl("file:///android_asset/index.html");
    }

    /** Abre el selector de ficheros del sistema para el WebView (restauración de copias JSON). */
    public boolean openFileChooser(android.webkit.ValueCallback<Uri[]> cb,
                                   WebChromeClient.FileChooserParams params) {
        if (pendingFileChooser != null) {
            pendingFileChooser.onReceiveValue(null);
        }
        pendingFileChooser = cb;
        try {
            Intent intent = params.createIntent();
            intent.addCategory(Intent.CATEGORY_OPENABLE);
            startActivityForResult(intent, FILE_CHOOSER_REQUEST);
            return true;
        } catch (Exception e) {
            pendingFileChooser = null;
            return false;
        }
    }

    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == 4601) {
            resultadoPermisoHealthConnect();
            super.onActivityResult(requestCode, resultCode, data);
            return;
        }
        if (requestCode == FILE_CHOOSER_REQUEST) {
            Uri[] results = null;
            if (resultCode == Activity.RESULT_OK && data != null) {
                if (data.getDataString() != null) {
                    results = new Uri[]{Uri.parse(data.getDataString())};
                } else if (data.getClipData() != null) {
                    int count = data.getClipData().getItemCount();
                    results = new Uri[count];
                    for (int i = 0; i < count; i++) {
                        results[i] = data.getClipData().getItemAt(i).getUri();
                    }
                }
            }
            if (pendingFileChooser != null) {
                pendingFileChooser.onReceiveValue(results);
                pendingFileChooser = null;
            }
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                "(function() { try { if (window.handleAndroidBack && window.handleAndroidBack()) { return; } } catch(e) {} try { if (window.AndroidBridge && window.AndroidBridge.exitApp) { window.AndroidBridge.exitApp(); return; } if (window.Android && window.Android.exitApp) { window.Android.exitApp(); return; } } catch(e) {} })();",
                null
            );
        } else {
            super.onBackPressed();
        }
    }
}