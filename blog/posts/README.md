# Entradas del blog

Esta carpeta almacena las entradas originales en Markdown (`.md`).

## Organización

- Un archivo por entrada: `01-titulo-de-la-entrada.md`, `02-otra-entrada.md`, etc.
- El primer encabezado (`#`) contiene el título del documento.
- El resto conserva el texto, los subtítulos, las listas, los enlaces y las imágenes del original.
- Las imágenes de una entrada se guardan en `assets/blog/01/`, cambiando el número para cada entrada.

## Publicación

Los listados de `blog/index.html` e `index.html` (sección `#blog`) muestran el número de entrada (**Blog 01**, etc.), el título y la fecha. Cada entrada usa un `<details>` cerrado inicialmente: al pulsar su `<summary>`, el artículo se despliega en la misma página sobre fondo negro. No añadas el atributo `open` por defecto.

La página de lectura independiente conserva su URL para enlaces existentes y comparte el fondo negro y el texto claro. Usa `.blog-article` y `.article-content`, con cabecera, iconos de contacto y un enlace de regreso al blog.

GitHub Pages sirve HTML estático en este repositorio: al publicar una entrada hay que conservar el archivo Markdown aquí y preparar su correspondiente HTML. No hay conversión automática configurada.

Al publicar o editar una entrada, actualiza el texto dentro de los desplegables de ambos listados y en su página de lectura independiente. El contenido cerrado permanece oculto incluso sin JavaScript.

## Blog 01

- Título: **¿Qué me trae hasta el día de hoy?**
- Documento de origen: `Bog 01 Corrected.docx`.
- Markdown: [01-que-me-trae-hasta-el-dia-de-hoy.md](01-que-me-trae-hasta-el-dia-de-hoy.md).
- Página publicada: [leer el artículo](https://diegoarangureen.github.io/blog/01-que-me-trae-hasta-el-dia-de-hoy/).
- Se conserva el contenido del documento, incluido su enlace al blog de Álvaro. El documento de Word permanece fuera del repositorio.
