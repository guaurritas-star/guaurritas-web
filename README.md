# Guaurritas OS

Experiencia web retro/Y2K de Guaurritas. El proyecto conserva el escritorio y
las ventanas en computadora; en móvil funciona como un lanzador de apps y cada
aplicación se abre a pantalla completa.

## GitHub Pages

Cada cambio enviado a `main` genera automáticamente una versión HTML estática
en la carpeta de compilación `out` y la publica mediante GitHub Pages.

URL prevista:

```text
https://guaurritas-star.github.io/guaurritas-web/
```

Ejemplo para incrustarla:

```html
<iframe
  src="https://guaurritas-star.github.io/guaurritas-web/"
  title="Guaurritas OS"
  style="width:100%;height:100dvh;border:0;display:block"
  loading="eager"
  allow="geolocation"
></iframe>
```

## Desarrollo local

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Abre [http://localhost:3001](http://localhost:3001) en el navegador.

Para comprobar la exportación HTML:

```bash
npm run build
```

El resultado queda en `out/index.html` junto con los recursos estáticos.
