# MisPep - Aplicación Android

Aplicación Android nativa e híbrida (Java + WebView moderno) diseñada para el seguimiento clínico de protocolos de péptidos (GLP-1/GIP/glucagón como Retatrutida, Tirzepatida, Semaglutida), control de peso, evolución de tensión arterial y reconstitución.

## Características principales
- **Seguimiento de dosis y calendario:** Programación de inyecciones periódicas con alarmas del sistema.
- **Evolución del peso corporal e IMC:** Historial cronológico, métricas de progreso semanal y cálculo de IMC dinámico.
- **Control de tensión arterial:** Registro de sistólica/diastólica, pulso y seguimiento de medicación antihipertensiva.
- **Calculadoras de reconstitución:** Cálculo de unidades en jeringuilla/pluma, agua BAC, diluciones, mezclas y formatos nasales.
- **Simulador farmacocinético:** Modelo bicompartimental para visualización de niveles circulantes previstos.
- **Bilingüe (Español / Inglés):** Selector instantáneo de idioma sin recarga.
- **Privacidad y almacenamiento local:** Todos los datos se almacenan localmente en el dispositivo.


## Estructura del repositorio
- `src/`: Código nativo Android en Java (`MainActivity.java`, `BootReceiver.java`, interfaz `@JavascriptInterface`).
- `assets/`: Frontend web embebido (HTML5, CSS3, JavaScript SPA, Chart.js, i18n).
- `res/`: Recursos Android (iconos mipmap y drawables).
- `AndroidManifest.xml`: Declaración de componentes, permisos y consultas de intents.
- `build.py`: Pipeline de compilación automatizado vía CLI SDK (aapt2, javac, d8, zipalign, apksigner).
- `MisPep.apk`: Binario compilado y firmado listo para instalar.

## Compilación
Requiere Android SDK Tools (API 34) y JDK 17+:
```bash
python3 build.py
```
