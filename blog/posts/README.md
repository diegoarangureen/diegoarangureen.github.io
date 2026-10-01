# Entradas del blog

Esta carpeta almacena las entradas originales en Markdown (`.md`).

## Organización

- Un archivo por entrada: `01-titulo-de-la-entrada.md`, `02-otra-entrada.md`, etc.
- El primer encabezado (`#`) contiene el título del documento.
- El resto conserva el texto, los subtítulos, las listas, los enlaces y las imágenes del original.
- Las imágenes de una entrada se guardan en `assets/blog/01/`, cambiando el número para cada entrada.

## Publicación

El listado de `blog/index.html` mostrará **Blog 01** y el título real, enlazados a la página de lectura `blog/01-titulo-de-la-entrada/index.html`.

La página de lectura usa los estilos compartidos `.blog-article` y `.article-content`: texto negro directamente sobre el fondo de la web, sin una tarjeta o panel detrás. Conserva la cabecera, los iconos de contacto y un enlace de regreso al blog.

GitHub Pages sirve HTML estático en este repositorio: al publicar una entrada hay que conservar el archivo Markdown aquí y preparar su correspondiente HTML. No hay conversión automática configurada.

La primera entrada está pendiente de recibir su documento de origen; todavía no se ha creado ni publicado contenido de ejemplo.
