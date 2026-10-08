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
        return "Uso de tus datos de peso";
    }

    @Override
    protected String textoPantalla() {
        return
            "MisPep lee de Health Connect únicamente los registros de PESO que la báscula "
            + "Fit Profile envía a Health Connect.\n\n"
            + "Para qué se usan:\n"
            + "• Mostrar tu peso actual, tu progreso y tu IMC dentro de MisPep.\n"
            + "• Rellenar tu historial de peso y tu gráfica de evolución.\n"
            + "• Entrar en tus copias de seguridad (ficheros en tu propio teléfono).\n\n"
            + "Para qué NO se usan:\n"
            + "• No se envían a internet ni a terceros.\n"
            + "• No se usan para publicidad ni para perfilarte.\n"
            + "• No se comparten con otras aplicaciones.";
    }
}
