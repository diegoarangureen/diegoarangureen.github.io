# Entradas del blog

Esta carpeta almacena las entradas originales en Markdown (`.md`).

## Organización

- Un archivo por entrada: `01-titulo-de-la-entrada.md`, `02-otra-entrada.md`, etc.
- El primer encabezado (`#`) contiene el título del documento.
- El resto conserva el texto, los subtítulos, las listas, los enlaces y las imágenes del original.
- Las imágenes de una entrada se guardan en `assets/blog/01/`, cambiando el número para cada entrada.

## Publicación

El listado de `blog/index.html` muestra el número de entrada (**Blog 01**, etc.) y su título real, enlazados a la página de lectura `blog/01-titulo-de-la-entrada/index.html`.

La página de lectura usa los estilos compartidos `.blog-article` y `.article-content`: texto negro directamente sobre el fondo de la web, sin una tarjeta o panel detrás. Conserva la cabecera, los iconos de contacto y un enlace de regreso al blog.

GitHub Pages sirve HTML estático en este repositorio: al publicar una entrada hay que conservar el archivo Markdown aquí y preparar su correspondiente HTML. No hay conversión automática configurada.

## Blog 01

- Título: **¿Qué me trae hasta el día de hoy?**
- Documento de origen: `Bog 01 Corrected.docx`.
- Markdown: [01-que-me-trae-hasta-el-dia-de-hoy.md](01-que-me-trae-hasta-el-dia-de-hoy.md).
- Página publicada: [leer el artículo](https://diegoarangureen.github.io/blog/01-que-me-trae-hasta-el-dia-de-hoy/).
- Se conserva el contenido del documento, incluido su enlace al blog de Álvaro. El documento de Word permanece fuera del repositorio.
