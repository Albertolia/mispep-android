package com.mispep.es;

/**
 * Pantalla de «uso de permisos» que Health Connect abre al mostrar por qué la app
 * usa los datos de salud (intent android.intent.action.VIEW_PERMISSION_USAGE con
 * categoría android.intent.category.HEALTH_PERMISSIONS).
 *
 * Health Connect exige las dos pantallas (esta y la de privacidad) para dejar que
 * la app solicite permisos; sin ellas cierra su diálogo al instante.
 */
public class UsoPermisos extends RazonPermisos {

    @Override
    protected String tituloPantalla() {
        return "Uso de tus datos de salud";
    }

    @Override
    protected String textoPantalla() {
        return
            "MisPep lee de Health Connect únicamente los registros de PESO (de la báscula) "
            + "y de PRESIÓN ARTERIAL y PULSO (del tensiómetro).\n\n"
            + "Para qué se usan:\n"
            + "• Mostrar tu peso, IMC y evolución de presión arterial dentro de MisPep.\n"
            + "• Rellenar tus historiales y gráficas de evolución clínica.\n"
            + "• Calcular automáticamente la media en tomas agrupadas en 15 minutos.\n"
            + "• Entrar en tus copias de seguridad locales (en tu propio teléfono).\n\n"
            + "Para qué NO se usan:\n"
            + "• No se envían a internet ni a ningún servidor externo.\n"
            + "• No se usan para publicidad ni para perfilarte.\n"
            + "• No se comparten con otras aplicaciones ni terceros.";
    }
}
