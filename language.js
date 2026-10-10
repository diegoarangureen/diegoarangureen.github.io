(() => {
  const button = document.querySelector('[data-language-toggle]');
  if (!button) return;

  const spanish = {
    skip: 'Saltar al contenido',
    notebookLabel: 'Cuaderno personal',
    notebookPages: 'Hojas del cuaderno',
    about: 'Sobre mí',
    turnScroll: 'Baja para pasar de página',
    readPost: 'LEER EL ARTÍCULO',
    allPosts: 'TODAS LAS ENTRADAS',
    projectDetails: 'VER EL PROYECTO',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    homeLabel: 'Diego Aranguren — inicio',
    profiles: 'Perfiles sociales y correo electrónico',
    linkedin: 'LinkedIn — se abre en una pestaña nueva',
    github: 'GitHub — se abre en una pestaña nueva',
    emailLabel: 'Escribir a Diego: diego.arangurengr@gmail.com',
    email: 'Correo electrónico',
    navigation: 'Navegación principal',
    projects: 'Proyectos',
    projectsUpper: 'PROYECTOS',
    projectsNumber: '01 / PROYECTOS',
    projectsTitle: 'Proyectos — Diego Aranguren',
    backHome: 'VOLVER AL INICIO',
    backBlog: 'VOLVER AL BLOG',
    backTop: 'Volver arriba',
    exploreMore: 'Explorar más',
    blogPosts: 'Entradas del blog',
    newTab: '(se abre en una pestaña nueva)',
    homeTitle: 'Diego Aranguren — Economía, analítica e ideas',
    homeEyebrow: 'ECONOMÍA, ANALÍTICA E IDEAS',
    intro: 'Economista cursando un máster en Business Analytics',
    interests: 'Me interesan el emprendimiento, las finanzas y el capital riesgo, con especial interés por la vertiente técnica y analítica de los negocios.',
    personal: 'Nativo de la IA, creativo y apasionado por desarrollar proyectos personales que comparto aquí.',
    exploreProjects: 'EXPLORA MIS PROYECTOS',
    explore: 'Algunas cosas por descubrir.',
    curiosity: 'SIGUE TU CURIOSIDAD',
    projectSummary: 'Proyectos personales y experimentos.',
    blogSummary: 'Notas, ideas y observaciones.',
    cvSummary: 'Formación y experiencia.',
    photos: 'Fotos personales',
    carousel: 'carrusel',
    slide: 'diapositiva',
    firstSlide: '1 de 2',
    secondSlide: '2 de 2',
    readingPhoto: 'Diego Aranguren leyendo al aire libre bajo los árboles.',
    ugentPhoto: 'Diego Aranguren en su primer día en la UGent.',
    previousPhoto: 'Foto anterior',
    nextPhoto: 'Foto siguiente',
    readingCaption: 'UN MOMENTO ENTRE IDEAS.',
    ugentCaption: 'primer día en UGent',
    viewGithub: 'VER EN GITHUB',
    experiments: 'EXPLORAR LOS EXPERIMENTOS',
    cvDocument: 'Currículum, septiembre de 2026',
    curriculum: 'CURRÍCULUM VITAE',
    cvDate: 'Septiembre de 2026',
    openCv: 'ABRIR CV',
    downloadPdf: 'DESCARGAR PDF',
    previewLabel: 'Abrir el CV completo en PDF en una pestaña nueva',
    previewAlt: 'Vista previa del CV de Diego Aranguren Gracia de septiembre de 2026, con formación, experiencia profesional, proyectos y habilidades.',
    previewNote: 'Selecciona la vista previa para abrir el PDF completo.',
  };

  // Keep the original text nodes so inline markup, icons and spacing stay intact.
  const textTargets = [...document.querySelectorAll('[data-i18n]')].map(element => {
    const node = [...element.childNodes].find(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim());
    return { element, node, key: element.dataset.i18n, original: node?.textContent };
  });
  const attributeTargets = [];
  for (const [marker, attribute] of Object.entries({
    label: 'aria-label', title: 'title', alt: 'alt', caption: 'data-caption', role: 'aria-roledescription',
  })) {
    document.querySelectorAll(`[data-i18n-${marker}]`).forEach(element => {
      attributeTargets.push({ element, attribute, key: element.getAttribute(`data-i18n-${marker}`), original: element.getAttribute(attribute) });
    });
  }

  function savedLanguage(fallback = 'en') {
    try { return localStorage.getItem('site-language') === 'es' ? 'es' : 'en'; }
    catch { return fallback; }
  }
  let language = savedLanguage();

  function applyLanguage(nextLanguage) {
    language = nextLanguage;
    document.documentElement.lang = language;
    for (const { element, node, key, original } of textTargets) {
      if (!node || !spanish[key]) continue;
      node.textContent = language === 'es' ? original.replace(/\S[\s\S]*\S|\S/, spanish[key]) : original;
      element.lang = language;
    }
    for (const { element, attribute, key, original } of attributeTargets) {
      element.setAttribute(attribute, language === 'es' ? spanish[key] : original);
    }
    button.textContent = language === 'es' ? 'EN' : 'ES';
    button.lang = language;
    button.setAttribute('aria-label', language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish');
    button.title = language === 'es' ? 'Cambiar a inglés' : 'Switch to Spanish';
    button.hidden = false;
    // The carousel reads translated data-caption values on subsequent changes.
    const activeSlide = document.querySelector('.portrait-slide.is-active');
    const caption = document.querySelector('[data-photo-caption]');
    if (activeSlide && caption) caption.textContent = activeSlide.dataset.caption;
  }

  button.addEventListener('click', () => {
    applyLanguage(language === 'en' ? 'es' : 'en');
    try { localStorage.setItem('site-language', language); } catch { /* Optional persistence. */ }
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) applyLanguage(savedLanguage(language));
  });
  window.addEventListener('storage', event => {
    if (event.key === 'site-language' || event.key === null) applyLanguage(savedLanguage(language));
  });
  applyLanguage(language);
})();
