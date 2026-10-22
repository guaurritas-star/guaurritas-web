# Correcciones de auditoría — 22 octubre 2026

Base: 4dfd70f117fbb168ab825f4c4b609c47623b3609. Rama sin cambios visuales y sin merge a producción.

## Cambios

- Next y eslint-config-next actualizados juntos de 16.3.0 a 16.4.2. Actualizaciones transitivas compatibles con npm audit fix, sin --force. No se degrada ESLint a Next 14.
- Toda comunicación postMessage del frontend pasa por src/lib/wix-message-security.ts. Destinos exactos https://www.guaurritas.com y https://guaurritas.com. Respuestas requieren simultáneamente origen permitido y ventana padre real. Se conservan tipos, payloads, IDs de solicitudes, cancelaciones y expiraciones. El puente público ya validaba el origen GitHub Pages y el iframe remitente.
- El destino usa el referrer solo si coincide exactamente con la lista; si falta se usa www.guaurritas.com. Padres externos y previews Wix con dominios distintos quedan fuera deliberadamente. Una preview externa debe probarse embebida desde el host autorizado; no ampliar por sufijos ni aceptar dominios enviados en mensajes.
- Error del recibo mostrado con textContent, con prueba de HTML hostil. Esta corrección se copia de la rama de revisión visual para que pueda aprobarse sin adoptar esa interfaz.
- No se cambian fotos, fichas, precios, catálogos, CSS, ventanas ni reglas del carrito. No se elimina código sin uso demostrado.

## Resultados

npm audit antes: 10 paquetes afectados, 1 crítico y 9 altos.
npm audit después: 5 paquetes afectados altos, 0 críticos.
npm audit --omit=dev después: 0 paquetes afectados.

Las cinco alertas restantes pertenecen a la cadena de desarrollo eslint-config-next → @next/eslint-plugin-next → fast-glob → micromatch → braces (GHSA-vfj7-8cjw-p6xm). No son cinco vulnerabilidades independientes demostradas en la web. npm propone bajar eslint-config-next a 14.2.35 mediante --force; no se aplica porque rompe la alineación con Next 16. Se mantiene pendiente del parche compatible upstream. Las cifras describen avisos conocidos del registro, no una certificación de seguridad.

31 pruebas aprobadas: conservación de carrito/modalidad, sesión, recompra, recibo y dos nuevas pruebas que rechazan padres/orígenes falsos y destinos manipulados. ESLint de los componentes modificados y build estático con TypeScript aprobados. Revisión React: sin hooks nuevos en componentes, mismos listeners y cleanup, funciones comunes sin estado compartido mutable, sin dependencias UI adicionales.

## Pendiente antes de publicar

- Prueba integrada en Wix: sesión Guaurrinotas, recompra, checkout y subida SPEI desde dominio autorizado, preservando carrito. No se ejecutaron pagos reales.
- Verificar esquema y RLS desplegados de Supabase antes de cambiar privacidad del bucket o perfiles; no modificar estas políticas solo a partir de las migraciones del repositorio.
- Validación visual independiente del PR60; esta rama no incluye la ruta de prueba ni su CSS.

No se accedió al backend Wix publicado ni a datos privados. No se publica esta rama automáticamente en GitHub Pages porque el workflow solo escucha main.
