# Bienvenida Guaurritas — revisión sin publicar

Base: `0ad87bc407d4efd51c0fc95db4309ed3a5a2d456`. Rama de revisión: `feat/welcome-review`.

## Implementación

La bienvenida es una aplicación del registro de ventanas existente. Reutiliza `RetroWindow`, el único estado de aplicación activa, sus controles y la barra de tareas. `Inicio` la reabre; cerrar, minimizar o abrir otra aplicación recuerda la salida durante la sesión. Es una ventana no modal: permite acceder al escritorio y a la barra de tareas; no oscurece ni bloquea el fondo. Al abrir recibe foco, Escape la cierra y el foco vuelve a un control conectado.

La apertura inicial espera fuentes e imágenes iniciales. Los accesos a apps, productos, mundos, entregas, anclas y retornos de compra evitan la bienvenida. El embed propaga también esa exclusión desde Wix, para que un parámetro no reenviado no se pierda dentro del iframe.

Los botones abren Cuisine mediante la navegación existente, actualizando la entrega compartida y la URL. La tienda reconoce explícitamente `fulfillment=leon`, además de nacional. No se modifica el contenido ni el precio de los carritos. Se conserva su regla vigente: cambiar el catálogo es posible, pero agregar productos de la otra modalidad se bloquea con un mensaje; no existe una confirmación de conversión del carrito.

La comunidad envía `guaurritas:community-open` al Custom Element. Su receptor existente comprueba origen y ventana emisora, desplaza el documento Wix al componente de comentarios observado y coloca el foco allí. En otra página o en la aplicación independiente se utiliza el destino de la portada. No se cambia código Velo ni el sitio publicado.

## Recursos reales

- Fotografía principal: `public/cuisine/products/petcakes-sizes-v2/mediano.webp`, ya utilizada por el catálogo. No procede de los mockups.
- Fotografía de comunidad: `be52e3_89f8ca3283034eada7c7b865c07d965b~mv2.jpg`, observada en el comentario publicado de Isabel Ayala en Wix. No se atribuye una calificación ni se reproduce su comentario.
- Destino observado: `comp-m4qz2a3f_r_comp-mnnkixwd`, contenedor del bloque «Comentarios (11)» en la portada. La cifra no se introduce en la bienvenida.
- Wix carga `https://guaurritas-star.github.io/guaurritas-web/guaurritas-embed.js`; por eso el ajuste del puente queda en este repositorio, sin editar Wix.

## Archivos

Nuevos: `WelcomeApp.tsx`, `welcome.css`, `welcome-session.ts`, `welcome.test.mjs` y este informe.

Modificados: `Desktop.tsx`, `RetroWindow.tsx`, `StoreApp.tsx`, `layout.tsx` y `public/guaurritas-embed.js`.

## Evidencia de validación

| Comprobación | Resultado |
| --- | --- |
| ESLint del proyecto | Correcto, sin reglas silenciadas |
| TypeScript y exportación Next | Correctos |
| Pruebas automatizadas | 15 aprobadas: carrito, bloqueo de entrega, recompra, sesión, concurrencia y nuevas pruebas de exclusión/cierre de bienvenida |
| Sitio Wix actual | Se observaron comentarios, fotos reales, ID de destino y script del embed en el DOM público |
| Revisión React | Un registro de ventanas; estado de bienvenida separado del carrito; eventos de interacción; actualización de ubicación compartida; ventana no modal con foco y Escape |
| 360, 390, 768, 1366 y 1440 px | Pendiente de render interactivo verificable |
| Poca altura, overflow, áreas seguras y superposición con WhatsApp | Pendiente de render interactivo y prueba en teléfono |
| Botones, foco, reapertura/minimizado en navegador | Implementados y revisados en código; prueba interactiva pendiente |
| Comunidad desde el iframe modificado | Receptor implementado; recorrido completo pendiente en una revisión Wix |
| Capturas desktop/móvil de la nueva implementación | No generadas; no se sustituyeron por mockups |
| Consola de la nueva implementación | Pendiente; no se declara libre de errores de runtime |

El navegador remoto devolvió `ERR_CONNECTION_REFUSED` para el servidor local. También rechazó archivos locales por su política de protocolos. No hay una vista previa privada disponible sin un despliegue adicional. Se conservaron los límites de acceso y la instrucción de no publicar.

## Estado y siguiente revisión

Implementación preparada para revisión, sin aceptación visual completa. No actualizar `main` ni fusionar esta rama hasta revisar los tamaños solicitados, el recorrido de comunidad dentro de Wix y los controles/foco. No se cambiaron precios, promociones, productos ni políticas. El workflow actual solo publica por push a `main` o por ejecución manual; la rama de revisión no lo dispara.
