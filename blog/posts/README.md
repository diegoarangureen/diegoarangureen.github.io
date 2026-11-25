# Entradas del blog

Esta carpeta almacena las entradas originales en Markdown (`.md`).

## Organización

- Un archivo por entrada: `01-titulo-de-la-entrada.md`, `02-otra-entrada.md`, etc.
- El primer encabezado (`#`) contiene el título del documento.
- El resto conserva el texto, los subtítulos, las listas, los enlaces y las imágenes del original.
- Las imágenes de una entrada se guardan en `assets/blog/01/`, cambiando el número para cada entrada.

## Publicación

GitHub Pages sirve HTML estático: al publicar una entrada, conserva el Markdown aquí y crea su página en `blog/NN-titulo/index.html` copiando la estructura de la entrada 01 (cabecera `.island`, `<main class="page">`, texto dentro de `.prose`).

Después añade la entrada a la lista `.tracklist` en dos sitios: la sección `#blog` de `index.html` y `blog/index.html`. Actualiza también el contador del disco "Blog" (`data-meta` en `index.html`, p. ej. "· 2 entries").

## Blog 01

- Título: **¿Qué me trae hasta el día de hoy?**
- Documento de origen: `Bog 01 Corrected.docx`.
- Markdown: [01-que-me-trae-hasta-el-dia-de-hoy.md](01-que-me-trae-hasta-el-dia-de-hoy.md).
- Página publicada: [leer el artículo](https://diegoarangureen.github.io/blog/01-que-me-trae-hasta-el-dia-de-hoy/).
- Se conserva el contenido del documento, incluido su enlace al blog de Álvaro. El documento de Word permanece fuera del repositorio.
