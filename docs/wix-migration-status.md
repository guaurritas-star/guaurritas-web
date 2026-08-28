# Migración Guaurritas a Wix Studio

Estado: Fase 0 iniciada.  
Rama de trabajo: `wix-react-port`  
Fuente canónica: `main` de `guaurritas-star/guaurritas-web`  
Commit base auditado: `45d0e298ede33ab868984af8c591cd0e8fd4d94d`  
Sitio Wix destino: `Guaurritas` (`c647b64d-bf76-407b-9408-d4ece5363a51`)  
Dominio: `https://www.guaurritas.com/`

## Decisión de arquitectura

El frontend se portará como una app privada construida con Wix CLI y una extensión Site Widget / Custom Element de React instalada en el sitio Wix Studio actual.

Esta extensión alojará el árbol React de Guaurritas OS dentro de un único contenedor de pantalla completa. No se reconstruirá el escritorio con elementos del editor, no se usará un iframe, no se incrustará un HTML gigante y no se dependerá de Codespaces ni de una URL externa.

El repositorio seguirá siendo la fuente de verdad. El port conservará los componentes, el DOM, los estados, CSS, assets y animaciones existentes. Las dependencias específicas de Next y Supabase se sustituirán mediante adaptadores de plataforma.

## Regla de fidelidad

Antes de integrar cada capa se compararán:

- proporciones y posiciones;
- colores y tipografías;
- iconos y estados hover;
- ventanas y barra de tareas;
- minimizar/restaurar;
- animaciones;
- comportamiento desktop y móvil.

No se reemplazará silenciosamente una función que Wix no pueda reproducir exactamente.

## Inventario del frontend original

| Área | Fuente principal | Estado actual | Acción de port |
|---|---|---|---|
| Guaurritas OS | `Desktop.tsx` | Funcional | Reutilizar árbol React |
| Ventanas | `RetroWindow.tsx` | Funcional, incluye minimizar | Reutilizar |
| Iconos Y2K | `RetroDesktopIcon.tsx` + `public/icons/desktop` | Funcionales | Reutilizar assets |
| Guaurriverse | `GuaurriverseApp.tsx` | Funcional | Reutilizar; adaptar navegación |
| Cuisine | `CuisineStoreApp.tsx` | Frontend funcional | Reutilizar; conectar Stores |
| Couture | `CoutureStoreApp.tsx` | Frontend funcional, aún en desarrollo | Reutilizar; conectar Stores |
| Paint | `PaintStudioApp.tsx` | Funcional | Reutilizar canvas e interacciones |
| Guaurrinotas | auth + perfiles/notas/feed | Depende de Supabase | Portar UI; migrar a Members/CMS/Media |
| Mi Mascota | perfiles/notas | Depende de Supabase | Portar UI; migrar a Members/CMS/Media |
| Expediente Robbie | `ExpedienteRobbieApp.tsx` | Frontend local | Reutilizar; definir datos finales |
| Chat Guaurritas | `ChatGuaurritasApp.tsx` | Simulación local | Reutilizar UI; backend pendiente |
| Carrito | acceso de escritorio | Placeholder | Conectar Wix eCommerce/cart |
| Responsive | CSS + componentes | Parcial | Verificar en cada fase |

## Sustituciones técnicas

| Dependencia actual | Port Wix |
|---|---|
| Next App Router | entrada del Site Widget |
| `next/image` | componente de imagen compartido |
| `next/font` | fuentes locales/`@font-face` |
| rutas `/api/*` | Wix SDK y backend Wix |
| Supabase Auth | Wix Members |
| tablas Supabase | Wix CMS |
| Supabase Storage | Wix Media Manager |
| carrito local/placeholder | Wix eCommerce cart |
| catálogo local | Wix Stores con adaptador de IDs/variantes |
| Tailwind 4 + `globals.css` | CSS compilado dentro del bundle Wix |

## Datos Wix existentes

El sitio destino tiene Wix Stores y Wix Members instalados. La auditoría encontró 20 productos ya creados en Wix Stores, por lo que no se volverán a crear ni duplicar. Se construirá un mapa estable entre los productos/variantes del frontend y sus IDs existentes en Wix.

El CMS contiene 22 colecciones de aplicaciones o contenido previo, pero todavía no contiene colecciones propias de Guaurrinotas o Mi Mascota. Esas colecciones se diseñarán y crearán después de congelar el modelo de datos original.

## Fases

1. Congelar fuente, inventario y referencias visuales.
2. Crear la app privada Wix CLI y el widget React de pantalla completa en un entorno sin publicar.
3. Portar Guaurritas OS: escritorio, ventanas, iconos, taskbar y minimizar/restaurar.
4. Portar Guaurriverse, Cuisine, Couture y Paint sin backend nuevo.
5. Crear la capa de Wix Stores: catálogo, variantes, carrito y checkout.
6. Sustituir Supabase por Wix Members, CMS y Media Manager para Mi Mascota.
7. Migrar Guaurrinotas a Members/CMS/Media, incluyendo permisos.
8. Completar Expediente Robbie y conectar Chat Guaurritas a su backend definitivo.
9. Validación responsive, accesibilidad, rendimiento y regresión visual.
10. Despliegue controlado, dominio, rollback y retirada de dependencias antiguas.

## Estados permitidos

- **Migrado:** frontend y backend definitivos funcionando en Wix.
- **Portado sin backend:** interfaz fiel funcionando, pero aún usa datos locales.
- **Conectado a Wix:** integración nativa verificada contra el sitio destino.
- **Placeholder:** simulación explícita que no debe presentarse como completa.
- **Pendiente:** todavía no portado.

## Limitación conocida de Wix Studio

La API de extensiones puede añadir el widget a la página de inicio y permitir que se estire, pero no controla con precisión su colocación ni toda la altura desde código. Será necesario un único ajuste estructural en el editor para estirar el contenedor del widget a la pantalla y evitar que el encabezado o pie de Wix interfieran. El escritorio, ventanas y controles seguirán siendo React; no se reconstruirán manualmente.

## Lo que no se hará

- iframe como arquitectura principal;
- dependencia permanente de una URL externa;
- copiar un HTML monolítico;
- recrear el escritorio con elementos Wix;
- publicar sobre el sitio actual sin revisión visual;
- duplicar el catálogo Wix existente;
- presentar placeholders como funciones migradas.
