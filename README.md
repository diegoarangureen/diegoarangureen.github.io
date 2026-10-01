# Diego Aranguren — Personal website

Web personal en inglés con presentación, fotografía y enlaces a LinkedIn y GitHub. Diseño inspirado en la composición editorial de [johnnyharris.ch](https://www.johnnyharris.ch/), con estilos propios.

- Web: https://diegoarangureen.github.io/
- Repositorio: https://github.com/diegoarangureen/diegoarangureen.github.io
- Publicación: GitHub Pages, rama `main`, carpeta raíz `/`.

## Archivos

- `index.html`: portada con presentación y enlaces.
- `carousel.js`: navegación manual entre las fotos de la portada, con botones y flechas del teclado. CSS aplica un fundido de 0,6 segundos, desactivado cuando se prefiere movimiento reducido.
- `projects/index.html`: ficha de MS Capital Market Forecasting, con descripción, portada y enlaces al repositorio y a sus experimentos.
- `blog/index.html`: blog, pendiente de contenido.
- `blog/posts/`: carpeta para las entradas originales en Markdown; [organización y publicación](blog/posts/README.md). Estilos de listado y lectura preparados; primera entrada pendiente de recibir el documento.
- `cv/index.html`: vista del CV con enlaces para abrir y descargar el PDF y una vista previa en escritorio y móvil.
- `styles.css`: estilos compartidos y adaptación a móvil.
- `assets/diego-aranguren.jpeg`: fotografía proporcionada por Diego, sin modificar; el encuadre se ajusta mediante CSS.
- `assets/diego-ugent.jpeg`: segunda foto de la portada, con el pie «first day in UGent». El archivo original se conserva; CSS oculta las franjas negras de la captura mediante el encuadre.
- `assets/cv/CV_DIEGO-ARANGUREN_SEP_2026.pdf`: CV original de septiembre de 2026, sin modificaciones.
- `assets/cv/cv-september-2026-page-1.png`: vista previa de la única página del PDF, renderizada para poder verla en cualquier navegador.
- `assets/projects/market-forecasting.jpg`: imagen editorial generada para el proyecto; [procedencia y prompt](assets/projects/README.md).
- `favicon.svg`: icono de la web.

La web usa HTML, CSS y JavaScript, sin dependencias externas ni proceso de compilación. Se pueden editar directamente los archivos de la web. Las fotos y sus pies se definen en `index.html`. El blog conserva un bloque `coming-soon` hasta incorporar entradas. Para actualizar el CV, añade el nuevo PDF, vuelve a generar la vista previa y cambia las rutas y la fecha en `cv/index.html`.

La descripción del proyecto se basa en su [README](https://github.com/diegoarangureen/mscapital-market-forecasting) y en su registro de experimentos, revisados el 30 de septiembre de 2026. La ficha evita fijar rankings o resultados temporales. La portada es conceptual: no representa resultados del modelo.

## Vista local y publicación

Abre `index.html` para ver la portada. Para probar también las rutas de las secciones, utiliza un servidor estático local con esta carpeta como raíz (por ejemplo, Live Server en VS Code).

Los cambios enviados a la rama `main` se publican automáticamente. El estado del despliegue se muestra en la pestaña **Actions** del repositorio.

Documentación: [GitHub Pages](https://docs.github.com/en/pages/quickstart).
