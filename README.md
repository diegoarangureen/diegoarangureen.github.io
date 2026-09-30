# Diego Aranguren — Personal website

Web personal en inglés con presentación, fotografía y enlaces a LinkedIn y GitHub. Diseño inspirado en la composición editorial de [johnnyharris.ch](https://www.johnnyharris.ch/), con estilos propios.

- Web: https://diegoarangureen.github.io/
- Repositorio: https://github.com/diegoarangureen/diegoarangureen.github.io
- Publicación: GitHub Pages, rama `main`, carpeta raíz `/`.

## Archivos

- `index.html`: portada con presentación y enlaces.
- `projects/index.html`: apartado de proyectos, pendiente de contenido.
- `blog/index.html`: blog, pendiente de contenido.
- `cv/index.html`: vista del CV con enlaces para abrir y descargar el PDF y una vista previa en escritorio y móvil.
- `styles.css`: estilos compartidos y adaptación a móvil.
- `assets/diego-aranguren.jpeg`: fotografía proporcionada por Diego, sin modificar; el encuadre se ajusta mediante CSS.
- `assets/cv/CV_DIEGO-ARANGUREN_SEP_2026.pdf`: CV original de septiembre de 2026, sin modificaciones.
- `assets/cv/cv-september-2026-page-1.png`: vista previa de la única página del PDF, renderizada para poder verla en cualquier navegador.
- `favicon.svg`: icono de la web.

La web usa HTML y CSS, sin dependencias externas ni proceso de compilación. Se pueden editar directamente los archivos HTML y CSS. Los apartados de blog y proyectos conservan un bloque `coming-soon` hasta incorporar contenido. Para actualizar el CV, añade el nuevo PDF, vuelve a generar la vista previa y cambia las rutas y la fecha en `cv/index.html`.

## Vista local y publicación

Abre `index.html` para ver la portada. Para probar también las rutas de las secciones, utiliza un servidor estático local con esta carpeta como raíz (por ejemplo, Live Server en VS Code).

Los cambios enviados a la rama `main` se publican automáticamente. El estado del despliegue se muestra en la pestaña **Actions** del repositorio.

Documentación: [GitHub Pages](https://docs.github.com/en/pages/quickstart).
