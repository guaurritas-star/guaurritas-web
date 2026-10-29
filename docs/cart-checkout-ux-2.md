# Carrito y Checkout UX 2.0

## Base y alcance

- Base: `main` en `17c079fa5ce5cd003b823e312ddf9d9f57300095` (PR #94).
- Último despliegue público exitoso confirmado: https://github.com/guaurritas-star/guaurritas-web/actions/runs/40805531456
- PR #95 consultado: borrador, sin fusionar. No se copian sus cambios de Cuisine.
- Rama independiente: `feat/cart-checkout-ux-2`. Sin fusión ni publicación en Wix.

## Auditoría antes de editar

Se compiló la base estable y se recorrió TaskbarCart/checkout en Chromium y WebKit de Windows, a 390 y 1366 px. Se revisaron capturas y los componentes, cálculos, validaciones, puente Wix y flujo SPEI existentes.

| Hallazgo | Ajuste puntual |
| --- | --- |
| Al avanzar a León desaparecían nombres y opciones; solo se veía cantidad y un importe. | Resumen desplegable abierto con productos, cantidades, opciones y personalización; regreso al carrito para editar cantidades o eliminar. |
| El importe principal de León no identificaba el método de pago. | Etiqueta SPEI y revisión con el importe correspondiente al método elegido; tarjeta explica procesamiento. |
| La selección de entrega no se resumía antes de continuar al pago. | Modalidad, punto/dirección y fecha/horario solicitados junto al importe; disponibilidad por WhatsApp y Uber aparte. |
| La validación indicaba completar datos sin señalar el campo. | Mensajes junto a fecha, horario, punto y dirección, `aria-invalid`, descripción accesible y foco en el primer campo pendiente. |
| En nacional, el total de productos podía confundirse con el total final. | Productos, envío y total **estimados**, usando el estado de envío ya calculado; Wix confirma dirección, plazo y total final. |
| El texto de carritos antiguos mixtos sugería dos pagos aunque ambos estaban bloqueados. | Texto coherente con la restricción existente: conservar una sola modalidad. |

No cambian catálogos, precios, descuentos, mínimos, procesamiento, reglas de fecha, opciones de entrega, pagos, referencia de productos/variantes, almacenamiento, puente Wix ni SPEI. Tampoco boot, íconos o Guaurriverse. Las dos expectativas de texto en las pruebas existentes se actualizan al nuevo mensaje del checkout compartido.

## Verificación local

- Dependencias originales de `package-lock.json`, Node 24.22.1 para tests/build/TypeScript; Playwright 1.56.1 añadido solo al entorno de pruebas, sin modificar manifiestos ni lockfile.
- 64/64 pruebas unitarias. La nueva matriz contrasta los mensajes con la validación existente y comprueba que no mutan preferencias. Se comprueban cantidades, variantes, campos personalizados, importes protegidos y notas en el puente Wix.
- Next build de producción con configuración GitHub Pages y TypeScript: aprobados. `tsc --noEmit`: aprobado.
- Nueva suite de compra: Chromium 24/24 y WebKit 24/24, con 390×844 y 1366×900; directo e iframe local tipo Wix.
- Casos: cantidad +/−, opciones/personalización, campos incompletos, WhatsApp/punto medio/domicilio, cambio de modalidad que reinicia la selección de pago, importes SPEI/tarjeta, envío bajo mínimo/estándar/gratis/sobrepeso, carritos mixtos, eliminación, persistencia tras recarga, Escape, ancho móvil, tamaños táctiles, solicitudes SPEI y checkout capturadas en el iframe, datos enviados y recuperación tras timeout.
- Suite responsive existente en Chromium: 5/5 aprobadas (desktop, 360/390/430 px y móvil en iframe).
- Suite responsive existente en WebKit Windows: desktop aprobado; 4 fallos en la expectativa de `getComputedStyle(...).overscrollBehaviorY`, que devuelve `undefined`. Las tres pruebas móviles directas reproducen el mismo fallo contra la web pública estable. No se modifica CSS ajeno al alcance para ocultar esa limitación. La ejecución Linux queda en GitHub Actions.

Las pruebas usan emulación, no dispositivos físicos. Los mensajes al puente se capturan sin backend de pago: **no constituyen una compra real ni una confirmación de Wix**. No se crean pedidos, transferencias, comprobantes ni cobros reales. Los IDs usados por la suite nueva son fixtures.

## Reproducción

```sh
npm ci
npm test
GITHUB_ACTIONS=true GITHUB_REPOSITORY=guaurritas-star/guaurritas-web npm run build
npx tsc --noEmit
# Instalar Playwright 1.56.1 en una carpeta aparte y enlazar sus dos paquetes.
# Así se conservan las versiones originales de las dependencias del proyecto.
npx playwright install chromium webkit
mkdir -p .preview/guaurritas-web
cp -a out/. .preview/guaurritas-web/
CART_QA_ENGINE=chromium node tests/cart-checkout-browser-smoke.mjs
CART_QA_ENGINE=webkit node tests/cart-checkout-browser-smoke.mjs
```

El workflow `cart-checkout-ux.yml` automatiza estas verificaciones en Linux y conserva capturas, incluidas las revisiones antes de pagar. No publica el sitio.
