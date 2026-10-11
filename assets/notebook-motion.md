# Open notebook

The notebook is inspired by [Jackie Zhang's portfolio](https://jackiezhang.co.za/): wide sheets stacked vertically, a horizontal binding, coral cloth cover, cream paper and handwritten details. The supplied photos, words and links remain Diego's; the small SVG drawings are original.

The reference opens its lower sheet around a horizontal fold as the reader scrolls. This site extends that pattern to three real HTML sheets for About, Blog and Projects. It does not lock scrolling, replace the text, render it into a canvas or create duplicate pages.

Motion uses perspective and `rotateX` about the horizontal fold, with synchronized light and shadow. Native CSS view timelines drive supported browsers; an event-driven JavaScript fallback maps the same geometry without a permanent render loop. On phones the tilt is smaller. Without JavaScript or with reduced motion, all pages remain flat and fully readable.

Guidance: [Animations by mthines](https://github.com/mthines/agent-skills/tree/main/skills/design/animations), MIT. Downloaded locally in `.preview/skills/mthines-animation-source/skills/design/animations`. Applied the rules for 3D interaction, scroll timelines, transforms, lighting, accessibility and performance. The skill itself is a development reference and is not loaded by the website.

## Validation

Measured in headless Edge on 11 October 2026, with browser-generated scroll gestures down and back up. Desktop (1440 × 1000): 411 sampled frame intervals, median 16.7 ms, 95th percentile 33.3 ms, one interval above 34 ms and no main-thread tasks above 50 ms. Mobile viewport (390 × 844): 435 intervals, median 16.7 ms, 95th percentile 16.9 ms, no intervals above 34 ms and no tasks above 50 ms. These are local browser measurements, not a claim about physical phones or every device.

Each trace recorded zero layout events and fourteen paint events over the complete journey, rather than a layout/paint on every frame. Only transforms and the lighting overlay's opacity animate. Reduced-motion checks confirmed that all three sheets stay flat at every scroll position.

All five routes were checked in English and Spanish at eight viewport sizes from 320 to 1440 pixels, including tablet and landscape layouts. Checks cover horizontal overflow, centered header links, keyboard focus after section navigation, rapid navigation reversal, resizing while reading, original article text and PDF bytes, the photo carousel, direct section links, reduced motion and the no-JavaScript/JavaScript-scroll fallbacks. A final pass after simplifying the redundant bottom controls repeated the route and interaction checks at desktop and phone sizes.

Local evidence is saved in `.preview/open-notebook-performance.json`, the matching DevTools traces and multi-position screenshots. `screen-recorder` — skipped (not installed). `video-analyser` — skipped (not installed).
