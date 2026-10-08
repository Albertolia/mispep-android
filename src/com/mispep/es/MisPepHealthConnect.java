package com.mispep.es;

import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.Context;
import android.content.pm.PackageManager;
import android.health.connect.HealthConnectManager;
import android.health.connect.HealthPermissions;
import android.health.connect.LocalTimeRangeFilter;
import android.health.connect.ReadRecordsRequestUsingFilters;
import android.health.connect.ReadRecordsResponse;
import android.health.connect.TimeRangeFilter;
import android.health.connect.datatypes.WeightRecord;
import android.os.Build;
import android.os.OutcomeReceiver;
import android.util.Log;
import org.json.JSONArray;
import org.json.JSONObject;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;
import java.util.concurrent.Executor;

/**
 * Lectura de pesajes desde Health Connect (Android 14 / API 34 o superior).
 * Toda la clase se carga solo cuando la app comprueba la version de Android,
 * de modo que en moviles antiguos (minSdk 24) nunca se toca.
 */
public final class MisPepHealthConnect {

    /** Codigo de peticion de permiso. Debe coincidir con onRequestPermissionsResult de MainActivity. */
    public static final int PETICION_PERMISO = 4601;

    private MisPepHealthConnect() {
    }

    public static boolean disponible(Context c) {
        if (Build.VERSION.SDK_INT < 34) return false;
        try {
            return c.getSystemService("healthconnect") != null;
        } catch (Throwable t) {
            return false;
        }
    }

    public static boolean tienePermiso(Context c) {
        if (!disponible(c)) return false;
        try {
            return c.checkSelfPermission(HealthPermissions.READ_WEIGHT) == PackageManager.PERMISSION_GRANTED;
        } catch (Throwable t) {
            return false;
        }
    }

    public static void pedirPermiso(MainActivity a) {
        if (!disponible(a)) return;

        // Health Connect no responde al requestPermissions() normal: hay que abrir
        // su propia pantalla de permisos con este intent y los nombres de permiso.
        try {
            // Android 14+: el permiso de salud se pide como cualquier otro permiso;
            // el sistema lo deriva a la pantalla de Health Connect.
            a.requestPermissions(new String[]{HealthPermissions.READ_WEIGHT}, PETICION_PERMISO);
        } catch (Throwable t) {
            try {
                Intent peticion = new Intent("android.health.connect.action.REQUEST_HEALTH_PERMISSIONS");
                peticion.putExtra("android.content.pm.extra.REQUEST_PERMISSIONS_NAMES",
                        new String[]{HealthPermissions.READ_WEIGHT});
                a.startActivityForResult(peticion, PETICION_PERMISO);
            } catch (Throwable t2) {
                a.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas("No se pudo pedir el permiso: " + t2) + ")");
            }
        }
    }

    /** Lee los pesajes de los ultimos N dias y los devuelve a JavaScript. */
    public static void leerPesos(MainActivity act, int dias) {
        try {
            HealthConnectManager mgr = (HealthConnectManager) act.getSystemService("healthconnect");
            if (mgr == null) {
                act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas("Health Connect no disponible") + ")");
                return;
            }
            if (!tienePermiso(act)) {
                act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas("sin permiso") + ")");
                return;
            }

            final int rango = (dias > 0 && dias <= 3650) ? dias : 120;
            LocalDateTime hasta = LocalDateTime.now();
            LocalDateTime desde = hasta.minusDays(rango);

            // El rango se expresa con LocalTimeRangeFilter (API publica del SDK).
            // TimeRangeFilter no tiene fabricas estaticas en el framework real.
            TimeRangeFilter filtro = new LocalTimeRangeFilter.Builder()
                    .setStartTime(desde)
                    .setEndTime(hasta)
                    .build();

            ReadRecordsRequestUsingFilters<WeightRecord> peticion =
                    new ReadRecordsRequestUsingFilters.Builder<WeightRecord>(WeightRecord.class)
                            .setTimeRangeFilter(filtro)
                            .setAscending(true)
                            .setPageSize(500)
                            .build();

            Log.i("MisPepHC", "consulta de pesajes: " + rango + " dias, permiso=" + tienePermiso(act));
            Executor ejecutor = act.getMainExecutor();
            mgr.readRecords(peticion, ejecutor, new ReceptorPesos(act));

        } catch (Throwable t) {
            Log.e("MisPepHC", "fallo al consultar Health Connect", t);
            act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas(String.valueOf(t)) + ")");
        }
    }

    /** Comillas seguras para inyectar textos en JavaScript. */
    static String comillas(String s) {
        try {
            return JSONObject.quote(s == null ? "" : s);
        } catch (Throwable t) {
            return "\"\"";
        }
    }

    /**
     * Receptor de la respuesta de Health Connect.
     * Se implementa la version sin genericos (raw) porque d8 8.2.2 falla al
     * procesar clases que implementan interfaces genericas (probado con sondas).
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public static class ReceptorPesos implements OutcomeReceiver {

        private final MainActivity act;

        public ReceptorPesos(MainActivity a) {
            this.act = a;
        }

        public void onResult(Object respuesta) {
            JSONArray arr = new JSONArray();
            try {
                ReadRecordsResponse<WeightRecord> respuestaPesos = (ReadRecordsResponse<WeightRecord>) respuesta;
                List<WeightRecord> lista = respuestaPesos.getRecords();
                ZoneId zona = ZoneId.systemDefault();
                for (int i = 0; i < lista.size(); i++) {
                    WeightRecord w = lista.get(i);
                    ZonedDateTime local = w.getTime().atZone(zona);
                    JSONObject o = new JSONObject();
                    o.put("fecha", w.getTime().toString());
                    o.put("fechaLocal", local.toLocalDate().toString());
                    o.put("hora", String.format(java.util.Locale.US, "%02d:%02d", local.getHour(), local.getMinute()));
                    o.put("peso", Math.round(w.getWeight().getInGrams() / 100.0) / 10.0);
                    try {
                        o.put("origen", w.getMetadata().getDataOrigin().getPackageName());
                    } catch (Throwable ignored) {
                    }
                    arr.put(o);
                }
            } catch (Throwable t) {
                // se devuelve lo que se haya podido leer
            }
            Log.i("MisPepHC", "respuesta de Health Connect: " + arr.length() + " pesajes");
            act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC(" + arr.toString() + ", '')");
        }

        public void onError(Throwable e) {
            Log.w("MisPepHC", "error de Health Connect: " + e);
            act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas(String.valueOf(e.getMessage())) + ")");
        }
    }
}
