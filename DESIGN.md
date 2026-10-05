# Diseño de la web de Diego Aranguren

## Alcance confirmado

Rediseño nuevo autorizado el 5 de octubre de 2026, conservando fotografías y contenido, con publicación mediante commit y push. La prueba blanca anterior fue descartada y no es la dirección de este diseño.

## Comparativa de skills

| Skill | Aportación | Valoración para esta web |
| --- | --- | --- |
| [Impeccable](https://github.com/pbakaus/impeccable) | Revisión de jerarquía, simplificación, adaptación móvil y accesibilidad. | Elegida por su proceso de revisión de una web existente. Se aplican sus guías; no se instala su motor ni hooks. |
| [Taste, redesign-existing-projects](https://github.com/Leonxlnx/taste-skill/blob/main/skills/redesign-skill/SKILL.md) | Cambios dirigidos sobre el stack existente, composición y tipografía. | Útil, pero algunas recomendaciones de añadir texturas o efectos no convienen a esta página. No se siguen consejos de inventar datos o variar fechas. |
| [Anthropic frontend-design](https://github.com/anthropics/skills/blob/main/skills/frontend-design/SKILL.md) | Dirección visual basada en el tema, contención y lenguaje claro. | Buena guía breve, menos específica para revisar todas las páginas y estados. |

La elección no es un ranking universal. En una [comparación informal de usuarios](https://www.reddit.com/r/ClaudeCode/comments/1syachi/best_skill_for_uxui_impeccable_vs_uxui_pro_max_vs/), un participante valora la coherencia de Impeccable y prefiere ligeramente el aspecto de Taste; señala que ambos aún pueden producir elementos genéricos. En [otra discusión](https://www.reddit.com/r/claudeskills/comments/1w2imnh/i_built_a_skill_to_give_claude_some_design_taste/), un usuario encuentra Impeccable demasiado prescriptivo para su aplicación existente. Son opiniones individuales, no pruebas controladas ni consenso.

## Sistema visual

- Fondo de portada y cabecera: `#153e35`, relacionado con el entorno verde de las fotos reales.
- Superficie de lectura: `#f1f3ed`; texto principal: `#18372f`; artículo: `#111`.
- Enlaces y acciones: `#1a5545`; texto secundario: `#56665d`; foco sobre verde: `#d8e8bd`.
- Literata para títulos y lectura larga; Source Sans 3 para navegación y presentación. Ambas servidas localmente.
- Contenido limitado a 1120px; artículo a 720px. Una columna en móvil; presentación y fotografía en paralelo a partir de 700px.
- Sin cuadrícula decorativa, garabatos, marcos inclinados, números ornamentales ni etiquetas duplicadas. «Blog 01» permanece porque identifica una entrada real.
- Portada con enlaces al proyecto y al artículo publicados y acceso al CV. Las fotografías y los textos originales permanecen.
- Carrusel manual con fundido de 0,6 segundos y alternativa sin movimiento. Selector ES/EN persistente; los contenidos de artículos y proyectos conservan su idioma.
- Sin fuentes remotas en tiempo de ejecución ni nuevas dependencias JavaScript.

## Validación

Cinco rutas, dos idiomas y siete anchos (320, 375, 390, 620, 768, 1024 y 1440px) en Edge/Chromium. Comprobaciones de desbordamiento, controles solapados, teclado, foco, navegación, selector de idioma, carrusel, movimiento reducido, contenido original del blog y descarga del PDF idéntica al original. Capturas de escritorio y móvil revisadas. Viewports emulados; no se afirma haber probado Safari ni dispositivos físicos.
