package com.mispep.es;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.health.connect.HealthConnectManager;
import android.health.connect.HealthPermissions;
import android.health.connect.LocalTimeRangeFilter;
import android.health.connect.ReadRecordsRequestUsingFilters;
import android.health.connect.ReadRecordsResponse;
import android.health.connect.TimeRangeFilter;
import android.health.connect.datatypes.BloodPressureRecord;
import android.health.connect.datatypes.HeartRateRecord;
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
 * Lectura de pesajes y presión arterial desde Health Connect (Android 14 / API 34 o superior).
 * Toda la clase se carga solo cuando la app comprueba la versión de Android,
 * de modo que en móviles antiguos (minSdk 24) nunca se toca.
 */
public final class MisPepHealthConnect {

    /** Código de petición de permiso. Debe coincidir con onRequestPermissionsResult de MainActivity. */
    public static final int PETICION_PERMISO = 4601;

    public static final String[] PERMISOS_HC = new String[]{
            HealthPermissions.READ_WEIGHT,
            HealthPermissions.READ_BLOOD_PRESSURE,
            HealthPermissions.READ_HEART_RATE
    };

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

    public static boolean tienePermisoPresion(Context c) {
        if (!disponible(c)) return false;
        try {
            return c.checkSelfPermission(HealthPermissions.READ_BLOOD_PRESSURE) == PackageManager.PERMISSION_GRANTED;
        } catch (Throwable t) {
            return false;
        }
    }

    public static void pedirPermiso(MainActivity a) {
        if (!disponible(a)) return;
        try {
            // Android 14+: el permiso de salud se pide como cualquier otro permiso;
            // el sistema lo deriva a la pantalla de Health Connect.
            a.requestPermissions(PERMISOS_HC, PETICION_PERMISO);
        } catch (Throwable t) {
            try {
                Intent peticion = new Intent("android.health.connect.action.REQUEST_HEALTH_PERMISSIONS");
                peticion.putExtra("android.content.pm.extra.REQUEST_PERMISSIONS_NAMES", PERMISOS_HC);
                a.startActivityForResult(peticion, PETICION_PERMISO);
            } catch (Throwable t2) {
                a.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas("No se pudo pedir el permiso: " + t2) + ")");
            }
        }
    }

    /** Lee los pesajes de los últimos N días y los devuelve a JavaScript. */
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

            final int rango = (dias > 0 && dias <= 3650) ? dias : 180;
            LocalDateTime hasta = LocalDateTime.now();
            LocalDateTime desde = hasta.minusDays(rango);

            TimeRangeFilter filtro = new LocalTimeRangeFilter.Builder()
                    .setStartTime(desde)
                    .setEndTime(hasta)
                    .build();

            ReadRecordsRequestUsingFilters<WeightRecord> peticion =
                    new ReadRecordsRequestUsingFilters.Builder<WeightRecord>(WeightRecord.class)
                            .setTimeRangeFilter(filtro)
                            .setAscending(true)
                            .setPageSize(1000)
                            .build();

            Log.i("MisPepHC", "consulta de pesajes: " + rango + " días, permiso=" + tienePermiso(act));
            Executor ejecutor = act.getMainExecutor();
            mgr.readRecords(peticion, ejecutor, new ReceptorPesos(act));

        } catch (Throwable t) {
            Log.e("MisPepHC", "fallo al consultar Health Connect (pesajes)", t);
            act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas(String.valueOf(t)) + ")");
        }
    }

    /** Lee las mediciones de presión arterial de los últimos N días y las devuelve a JavaScript. */
    public static void leerPresion(MainActivity act, int dias) {
        try {
            HealthConnectManager mgr = (HealthConnectManager) act.getSystemService("healthconnect");
            if (mgr == null) {
                act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC([], " + comillas("Health Connect no disponible") + ")");
                return;
            }
            if (!tienePermisoPresion(act)) {
                act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC([], " + comillas("sin permiso") + ")");
                return;
            }

            final int rango = (dias > 0 && dias <= 3650) ? dias : 180;
            LocalDateTime hasta = LocalDateTime.now();
            LocalDateTime desde = hasta.minusDays(rango);

            TimeRangeFilter filtro = new LocalTimeRangeFilter.Builder()
                    .setStartTime(desde)
                    .setEndTime(hasta)
                    .build();

            ReadRecordsRequestUsingFilters<BloodPressureRecord> peticion =
                    new ReadRecordsRequestUsingFilters.Builder<BloodPressureRecord>(BloodPressureRecord.class)
                            .setTimeRangeFilter(filtro)
                            .setAscending(true)
                            .setPageSize(1000)
                            .build();

            Log.i("MisPepHC", "consulta de presión arterial: " + rango + " días");
            Executor ejecutor = act.getMainExecutor();
            mgr.readRecords(peticion, ejecutor, new ReceptorPresion(act, mgr, filtro));

        } catch (Throwable t) {
            Log.e("MisPepHC", "fallo al consultar presión en Health Connect", t);
            act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC([], " + comillas(String.valueOf(t)) + ")");
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
     * Receptor de la respuesta de pesajes de Health Connect.
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
            Log.w("MisPepHC", "error de Health Connect (pesos): " + e);
            act.enviarAJavaScript("window.mispepPesosHC && window.mispepPesosHC([], " + comillas(String.valueOf(e.getMessage())) + ")");
        }
    }

    /**
     * Receptor de la respuesta de presión arterial de Health Connect.
     */
    @SuppressWarnings({"unchecked", "rawtypes"})
    public static class ReceptorPresion implements OutcomeReceiver {

        private final MainActivity act;
        private final HealthConnectManager mgr;
        private final TimeRangeFilter filtro;

        public ReceptorPresion(MainActivity a, HealthConnectManager m, TimeRangeFilter f) {
            this.act = a;
            this.mgr = m;
            this.filtro = f;
        }

        public void onResult(Object respuesta) {
            try {
                ReadRecordsResponse<BloodPressureRecord> respBP = (ReadRecordsResponse<BloodPressureRecord>) respuesta;
                final List<BloodPressureRecord> listaBP = respBP.getRecords();
                if (listaBP == null || listaBP.isEmpty()) {
                    act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC([], '')");
                    return;
                }

                // Si hay permiso para leer el pulso (HeartRateRecord), lo leemos para enriquecer las tomas
                if (act.checkSelfPermission(HealthPermissions.READ_HEART_RATE) == PackageManager.PERMISSION_GRANTED) {
                    ReadRecordsRequestUsingFilters<HeartRateRecord> peticionHR =
                            new ReadRecordsRequestUsingFilters.Builder<HeartRateRecord>(HeartRateRecord.class)
                                    .setTimeRangeFilter(filtro)
                                    .setAscending(true)
                                    .setPageSize(2000)
                                    .build();
                    mgr.readRecords(peticionHR, act.getMainExecutor(), new ReceptorPulso(act, listaBP));
                    return;
                }

                procesarRegistrosBP(act, listaBP, null);
            } catch (Throwable t) {
                Log.e("MisPepHC", "error procesando respuesta de presión", t);
                act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC([], " + comillas(String.valueOf(t)) + ")");
            }
        }

        public void onError(Throwable e) {
            Log.w("MisPepHC", "error de Health Connect en presión: " + e);
            act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC([], " + comillas(String.valueOf(e.getMessage())) + ")");
        }
    }

    @SuppressWarnings({"unchecked", "rawtypes"})
    public static class ReceptorPulso implements OutcomeReceiver {

        private final MainActivity act;
        private final List<BloodPressureRecord> listaBP;

        public ReceptorPulso(MainActivity a, List<BloodPressureRecord> bp) {
            this.act = a;
            this.listaBP = bp;
        }

        public void onResult(Object respuesta) {
            List<HeartRateRecord> listaHR = null;
            try {
                ReadRecordsResponse<HeartRateRecord> respHR = (ReadRecordsResponse<HeartRateRecord>) respuesta;
                listaHR = respHR.getRecords();
            } catch (Throwable ignored) {
            }
            procesarRegistrosBP(act, listaBP, listaHR);
        }

        public void onError(Throwable e) {
            procesarRegistrosBP(act, listaBP, null);
        }
    }

    static void procesarRegistrosBP(MainActivity act, List<BloodPressureRecord> listaBP, List<HeartRateRecord> listaHR) {
        JSONArray arr = new JSONArray();
        try {
            ZoneId zona = ZoneId.systemDefault();
            for (int i = 0; i < listaBP.size(); i++) {
                BloodPressureRecord bp = listaBP.get(i);
                long tMillis = bp.getTime().toEpochMilli();
                ZonedDateTime local = bp.getTime().atZone(zona);

                int sys = (int) Math.round(bp.getSystolic().getInMillimetersOfMercury());
                int dia = (int) Math.round(bp.getDiastolic().getInMillimetersOfMercury());
                int pulse = 0;

                if (listaHR != null && !listaHR.isEmpty()) {
                    long mejorDiff = 120000; // máximo 2 minutos de diferencia
                    for (int j = 0; j < listaHR.size(); j++) {
                        HeartRateRecord hr = listaHR.get(j);
                        List<HeartRateRecord.HeartRateSample> samples = hr.getSamples();
                        if (samples != null) {
                            for (int k = 0; k < samples.size(); k++) {
                                HeartRateRecord.HeartRateSample s = samples.get(k);
                                long sMillis = s.getTime().toEpochMilli();
                                long diff = Math.abs(sMillis - tMillis);
                                if (diff < mejorDiff) {
                                    mejorDiff = diff;
                                    pulse = (int) s.getBeatsPerMinute();
                                }
                            }
                        }
                    }
                }

                JSONObject o = new JSONObject();
                o.put("timestamp", tMillis);
                o.put("fecha", bp.getTime().toString());
                o.put("fechaLocal", local.toLocalDate().toString());
                o.put("hora", String.format(java.util.Locale.US, "%02d:%02d", local.getHour(), local.getMinute()));
                o.put("sys", sys);
                o.put("dia", dia);
                o.put("pulse", pulse);
                try {
                    o.put("origen", bp.getMetadata().getDataOrigin().getPackageName());
                } catch (Throwable ignored) {
                }
                arr.put(o);
            }
        } catch (Throwable t) {
            Log.e("MisPepHC", "error formateando registros BP", t);
        }
        Log.i("MisPepHC", "respuesta de Health Connect: " + arr.length() + " tomas de presión arterial");
        act.enviarAJavaScript("window.mispepPresionHC && window.mispepPresionHC(" + arr.toString() + ", '')");
    }
}
