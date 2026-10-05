# Diego Aranguren — Personal website

Web personal con interfaz en inglés y español, presentación, fotografía y enlaces a LinkedIn y GitHub. Portada verde profundo, fotografías personales y páginas claras para leer. [Decisiones de diseño y comparativa de skills](DESIGN.md).

- Web: https://diegoarangureen.github.io/
- Repositorio: https://github.com/diegoarangureen/diegoarangureen.github.io
- Publicación: GitHub Pages, rama `main`, carpeta raíz `/`.

## Archivos

- `index.html`: portada con presentación y enlaces.
- `language.js`: selector ES/EN y traducciones de la interfaz. Recuerda el idioma elegido con `localStorage` (`site-language`); el idioma inicial es inglés.
- `carousel.js`: navegación manual entre las fotos de la portada, con botones y flechas del teclado. CSS aplica un fundido de 0,6 segundos, desactivado cuando se prefiere movimiento reducido.
- `projects/index.html`: ficha de MS Capital Market Forecasting, con descripción, portada y enlaces al repositorio y a sus experimentos.
- `blog/index.html`: listado de entradas, con número y título enlazados a la página de lectura.
- `blog/posts/`: entradas originales en Markdown; [organización y publicación](blog/posts/README.md).
- `blog/posts/01-que-me-trae-hasta-el-dia-de-hoy.md`: Blog 01, convertido de `Bog 01 Corrected.docx` conservando el texto y el enlace del documento.
- `blog/01-que-me-trae-hasta-el-dia-de-hoy/index.html`: versión publicada del primer artículo, con texto negro directamente sobre el fondo de la web.
- `cv/index.html`: vista del CV con enlaces para abrir y descargar el PDF y una vista previa en escritorio y móvil.
- `styles.css`: estilos compartidos y adaptación a móvil.
- `assets/fonts/`: Literata y Source Sans 3, alojadas localmente en WOFF2 con sus licencias.
- `assets/diego-aranguren.jpeg`: fotografía proporcionada por Diego, sin modificar; el encuadre se ajusta mediante CSS.
- `assets/diego-ugent.jpeg`: segunda foto de la portada, con el pie «first day in UGent». El archivo original se conserva; CSS oculta las franjas negras de la captura mediante el encuadre.
- `assets/cv/CV_DIEGO-ARANGUREN_SEP_2026.pdf`: CV original de septiembre de 2026, sin modificaciones.
- `assets/cv/cv-september-2026-page-1.png`: vista previa de la única página del PDF, renderizada para poder verla en cualquier navegador.
- `assets/projects/market-forecasting.jpg`: imagen editorial generada para el proyecto; [procedencia y prompt](assets/projects/README.md).
- `favicon.svg`: icono de la web.

La web usa HTML, CSS y JavaScript, sin dependencias externas ni proceso de compilación. Se pueden editar directamente los archivos de la web. Las fotos y sus pies se definen en `index.html`. Para actualizar una entrada, modifica su Markdown y su HTML publicado; el listado está en `blog/index.html`. Para actualizar el CV, añade el nuevo PDF, vuelve a generar la vista previa y cambia las rutas y la fecha en `cv/index.html`.

El selector ES/EN traduce los textos generales, la presentación, los controles y los pies de foto. Los artículos, el contenido de los proyectos y el PDF del CV conservan su idioma original. El HTML contiene el texto inglés; `data-i18n` identifica su traducción en el diccionario de `language.js`, sin reemplazar los elementos hijos. Los atributos accesibles y los pies del carrusel usan `data-i18n-label`, `data-i18n-title`, `data-i18n-alt`, `data-i18n-role` y `data-i18n-caption`. Al crear páginas nuevas, incluye el selector y el script con la ruta relativa adecuada. Sin JavaScript se mantiene la web en inglés y el selector permanece oculto.

La descripción del proyecto se basa en su [README](https://github.com/diegoarangureen/mscapital-market-forecasting) y en su registro de experimentos, revisados el 30 de septiembre de 2026. La ficha evita fijar rankings o resultados temporales. La portada es conceptual: no representa resultados del modelo.

## Vista local y publicación

Abre `index.html` para ver la portada. Para probar también las rutas de las secciones, utiliza un servidor estático local con esta carpeta como raíz (por ejemplo, Live Server en VS Code).

Los cambios enviados a la rama `main` se publican automáticamente. El estado del despliegue se muestra en la pestaña **Actions** del repositorio.

Documentación: [GitHub Pages](https://docs.github.com/en/pages/quickstart).
