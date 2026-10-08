package com.mispep.es;

import android.app.Activity;
import android.graphics.Color;
import android.os.Bundle;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/**
 * Pantalla de privacidad que Health Connect exige a las apps antes de mostrar
 * su diálogo de permisos (intent androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE).
 * Sin esta pantalla, Health Connect cierra el diálogo de permisos al instante.
 *
 * El texto se puede cambiar en las subclases (ver UsoPermisos).
 */
public class RazonPermisos extends Activity {

    /** Cierra la pantalla y devuelve el control a Health Connect. */
    static class CerrarListener implements View.OnClickListener {
        private final Activity actividad;

        CerrarListener(Activity actividad) {
            this.actividad = actividad;
        }

        public void onClick(View v) {
            actividad.finish();
        }
    }

    protected String tituloPantalla() {
        return "Privacidad y Health Connect";
    }

    protected String textoPantalla() {
        return
            "MisPep usa Health Connect para una única cosa: leer los pesajes que tu báscula "
            + "envía a Health Connect a través de la aplicación Fit Profile.\n\n"
            + "• Solo LEE el dato «Peso» (y nunca en segundo plano).\n"
            + "• NO escribe nada en Health Connect.\n"
            + "• NO envía tus datos a ningún servidor: todo se queda en tu teléfono.\n"
            + "• Los pesajes importados se guardan junto a tu historial y entran también en tus "
            + "copias de seguridad automáticas, que se guardan en tu propio teléfono.\n\n"
            + "Puedes retirar este permiso cuando quieras desde Health Connect → Permisos de "
            + "aplicaciones → MisPep. Si lo retiras, MisPep seguirá funcionando con normalidad, "
            + "simplemente no leerá nuevos pesajes de la báscula.\n\n"
            + "Pulsa «Entendido» para continuar con el permiso.";
    }

    @Override
    protected void onCreate(Bundle estado) {
        super.onCreate(estado);
        int margen = (int) (22 * getResources().getDisplayMetrics().density);

        ScrollView desplazable = new ScrollView(this);
        LinearLayout columna = new LinearLayout(this);
        columna.setOrientation(LinearLayout.VERTICAL);
        columna.setBackgroundColor(Color.parseColor("#0F1720"));
        columna.setPadding(margen, margen, margen, margen);

        TextView titulo = new TextView(this);
        titulo.setText(tituloPantalla());
        titulo.setTextColor(Color.WHITE);
        titulo.setTextSize(23f);
        columna.addView(titulo);

        TextView cuerpo = new TextView(this);
        cuerpo.setText(textoPantalla());
        cuerpo.setTextColor(Color.parseColor("#C9D4DC"));
        cuerpo.setTextSize(16f);
        cuerpo.setLineSpacing(0f, 1.15f);
        LinearLayout.LayoutParams parametrosCuerpo = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        parametrosCuerpo.topMargin = margen;
        cuerpo.setLayoutParams(parametrosCuerpo);
        columna.addView(cuerpo);

        Button boton = new Button(this);
        boton.setText("Entendido");
        boton.setTextSize(17f);
        boton.setOnClickListener(new CerrarListener(this));
        LinearLayout.LayoutParams parametrosBoton = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        parametrosBoton.topMargin = margen * 2;
        boton.setLayoutParams(parametrosBoton);
        columna.addView(boton);

        desplazable.addView(columna);
        setContentView(desplazable);
    }
}
