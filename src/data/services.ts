// src/data/services.ts
// Copy exacto según TEXTUM_NEW_PROPUESTA.docx

export type Tier = {
  name_es: string;
  name_en: string;
  usd: number;
  eur: number;
  priceNote_es: string;
  priceNote_en: string;
  highlight: boolean;
  badge_es?: string;
  badge_en?: string;
  desc_es: string;
  desc_en: string;
  cta_es: string;
  cta_en: string;
  features_es: string[];
  features_en: string[];
};

export type ServiceLine = {
  id: string;
  title_es: string;
  title_en: string;
  subtitle_es: string;
  subtitle_en: string;
  intro_es: string;
  intro_en: string;
  tiers: Tier[];
};

export const SERVICE_LINES: ServiceLine[] = [
  // ─── TITULACIÓN ───────────────────────────────────────────────────
  {
    id: 'titulacion',
    title_es: 'Titulación',
    title_en: 'Degree Projects',
    subtitle_es: 'TFG · TFM · Tesis de maestría · Tesis doctoral',
    subtitle_en: 'Final Degree Project · Master´s Thesis · Doctoral Research',
    intro_es: 'Para TFG, TFM, tesis de maestría y tesis doctoral. Diseñado para estudiantes que necesitan estructurar, desarrollar, optimizar o finalizar su trabajo de titulación con acompañamiento metodológico real, estándares exigentes y una ruta clara de avance.',
    intro_en: 'For final degree projects, master´s and doctoral theses. Designed for students who need to structure, develop, optimise or finalise their graduation project with real methodological support, demanding standards and a clear path forward.',
    tiers: [
      {
        name_es: 'Ajuste de Estilo y Norma',
        name_en: 'Style & Standards Adjustment',
        usd: 199, eur: 189,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: false,
        desc_es: 'Para manuscritos avanzados que necesitan revisión de estilo académico, normalización formal y mejora de consistencia general.',
        desc_en: 'For advanced manuscripts requiring academic style review, formal standardisation and improvement of overall consistency.',
        cta_es: 'Postular al programa',
        cta_en: 'Apply to the programme',
        features_es: [
          'Optimización ortotipográfica y estilo académico',
          'Adecuación a normativa internacional (APA 7 / Vancouver)',
          'Revisión lógica general del texto',
          'Normalización de referencias bibliográficas',
        ],
        features_en: [
          'Orthotypographic optimisation and academic style',
          'Alignment with international standards (APA 7 / Vancouver)',
          'General logical review of the text',
          'Standardisation of bibliographic references',
        ],
      },
      {
        name_es: 'Mentoría Avanzada FLUX',
        name_en: 'Advanced FLUX Mentoring',
        usd: 349, eur: 329,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: true,
        badge_es: 'Más elegido',
        badge_en: 'Most popular',
        desc_es: 'Para maestrantes y doctorandos que necesitan fortalecer su estructura metodológica, ordenar su argumentación y mejorar la calidad científica del manuscrito.',
        desc_en: 'For master´s and doctoral students who need to strengthen their methodological structure, organise their argumentation and improve the scientific quality of their manuscript.',
        cta_es: 'Postular al programa',
        cta_en: 'Apply to the programme',
        features_es: [
          'Revisión de arquitectura del manuscrito',
          'Transferencia de criterio metodológico',
          'Sesión estratégica de mentoría en vivo',
          'Acompañamiento híbrido con uso ético de IA',
        ],
        features_en: [
          'Manuscript architecture review',
          'Transfer of methodological judgement',
          'Strategic live mentoring session',
          'Hybrid support with ethical AI use',
        ],
      },
      {
        name_es: 'Co-creación de Alta Intensidad',
        name_en: 'High-Intensity Co-creation',
        usd: 499, eur: 450,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: false,
        desc_es: 'Para proyectos complejos, bloqueados o con plazos ajustados que requieren una mentoría intensiva orientada a acelerar resultados sin comprometer la integridad académica.',
        desc_en: 'For complex, blocked or time-pressured projects that require intensive mentoring aimed at accelerating results without compromising academic integrity.',
        cta_es: 'Agendar diagnóstico académico',
        cta_en: 'Book an academic diagnosis',
        features_es: [
          'Co-diseño de la estructura del manuscrito',
          'Aceleración del proceso con alta exigencia metodológica',
          'Fortalecimiento de la solvencia científica del autor',
          'Acompañamiento continuo hasta la entrega final',
        ],
        features_en: [
          'Co-design of the manuscript structure',
          'Process acceleration with high methodological standards',
          'Strengthening of the author´s scientific competence',
          'Continuous support through to final submission',
        ],
      },
    ],
  },

  // ─── PUBLICACIÓN CIENTÍFICA ───────────────────────────────────────
  {
    id: 'publicacion',
    title_es: 'Publicación Científica',
    title_en: 'Scientific Publication',
    subtitle_es: 'Artículos para Scopus · Latindex · revistas indexadas',
    subtitle_en: 'Articles for Scopus · Latindex · indexed journals',
    intro_es: 'Para investigadores, docentes y candidatos a doctorado. Esta línea está orientada a quienes necesitan adaptar, optimizar o preparar manuscritos para revistas indexadas y procesos editoriales más exigentes.',
    intro_en: 'For researchers, educators and doctoral candidates. This line is aimed at those who need to adapt, optimise or prepare manuscripts for indexed journals and more demanding editorial processes.',
    tiers: [
      {
        name_es: 'Adaptación Editorial',
        name_en: 'Editorial Adaptation',
        usd: 299, eur: 279,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: false,
        desc_es: 'Para autores con manuscritos terminados que necesitan adecuación técnica a la revista objetivo, mejora del resumen y ajuste de referencias.',
        desc_en: 'For authors with finished manuscripts who need technical adaptation to the target journal, abstract improvement and reference adjustment.',
        cta_es: 'Postular al programa',
        cta_en: 'Apply to the programme',
        features_es: [
          'Revisión de estructura editorial',
          'Normalización de referencias (APA / Vancouver / Chicago)',
          'Mejora del resumen y palabras clave',
          'Optimización para la revista objetivo',
        ],
        features_en: [
          'Editorial structure review',
          'Reference standardisation (APA / Vancouver / Chicago)',
          'Abstract and keyword improvement',
          'Optimisation for the target journal',
        ],
      },
      {
        name_es: 'Pre-arbitraje Científico + FLUX',
        name_en: 'Scientific Pre-review + FLUX',
        usd: 499, eur: 450,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: true,
        badge_es: 'Más elegido',
        badge_en: 'Most popular',
        desc_es: 'Para autores que buscan elevar la calidad metodológica del artículo y aumentar su probabilidad de aceptación antes del envío a revista.',
        desc_en: 'For authors seeking to raise the methodological quality of their article and increase their chances of acceptance before journal submission.',
        cta_es: 'Postular al programa',
        cta_en: 'Apply to the programme',
        features_es: [
          'Revisión crítica de la estructura IMRyD',
          'Auditoría de referencias y coherencia interna',
          'Optimización híbrida con el método TEXTUM FLUX',
          'Sesión de mentoría científica en vivo',
        ],
        features_en: [
          'Critical review of IMRaD structure',
          'Reference audit and internal coherence',
          'Hybrid optimisation with TEXTUM FLUX method',
          'Live scientific mentoring session',
        ],
      },
      {
        name_es: 'Acompañamiento Editorial Premium',
        name_en: 'Premium Editorial Mentoring',
        usd: 799, eur: 750,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: false,
        desc_es: 'Para investigadores que requieren soporte estratégico antes y después del envío, incluyendo respuestas a revisores y trazabilidad ética del uso de IA durante el proceso.',
        desc_en: 'For researchers requiring strategic support before and after submission, including reviewer responses and ethical traceability of AI use throughout the process.',
        cta_es: 'Agendar diagnóstico académico',
        cta_en: 'Book an academic diagnosis',
        features_es: [
          'Acompañamiento en cover letter y carta de presentación',
          'Co-elaboración de respuestas a revisores',
          'Trazabilidad ética del uso de IA en el manuscrito',
          'Soporte estratégico hasta la aceptación final',
        ],
        features_en: [
          'Support with cover letter and presentation',
          'Co-drafting of reviewer responses',
          'Ethical traceability of AI use in the manuscript',
          'Strategic support through to final acceptance',
        ],
      },
    ],
  },

  // ─── DEFENSA ACADÉMICA ────────────────────────────────────────────
  {
    id: 'defensa',
    title_es: 'Defensa Académica',
    title_en: 'Academic Defence',
    subtitle_es: 'Sustentación · Tribunal · Oratoria académica',
    subtitle_en: 'Oral defence · Examination board · Academic oratory',
    intro_es: 'Para sustentación oral, presentación académica y simulación de tribunal. Esta línea acompaña la etapa final del proceso académico: la exposición, la argumentación oral y la respuesta estratégica ante preguntas críticas del jurado.',
    intro_en: 'For oral defence, academic presentation and committee simulation. This line supports the final stage of the academic process: delivery, oral argumentation and strategic response to critical questions from the panel.',
    tiers: [
      {
        name_es: 'Alta Defensa y Oratoria Académica',
        name_en: 'High Defence & Academic Oratory',
        usd: 120, eur: 110,
        priceNote_es: 'Precio de referencia',
        priceNote_en: 'Reference price',
        highlight: true,
        desc_es: 'Entrenamiento individual para estructurar el discurso, optimizar diapositivas, ensayar la presentación y responder con solvencia metodológica ante el tribunal.',
        desc_en: 'Individual training to structure the speech, optimise slides, rehearse the presentation and respond with methodological confidence before the committee.',
        cta_es: 'Reservar preparación de defensa',
        cta_en: 'Book defence preparation',
        features_es: [
          'Estructuración estratégica del guion y discurso de apertura',
          'Optimización visual de diapositivas (estándares universitarios)',
          'Entrenamiento en control de nervios, lenguaje corporal y voz',
          'Banco simulado de preguntas difíciles del tribunal',
          'Sesión 1:1 en vivo con correcciones inmediatas',
        ],
        features_en: [
          'Strategic structuring of the script and opening statement',
          'Visual optimisation of slides (university standards)',
          'Training in nerve control, body language and vocal delivery',
          'Simulated bank of challenging panel questions',
          'Live 1:1 session with immediate feedback',
        ],
      },
    ],
  },
];

// ─── MÉTODO FLUX — copy exacto del doc ───────────────────────────────────────
export const FLUX_METHOD = {
  es: {
    eyebrow: 'Método TEXTUM',
    title: 'Cómo trabaja TEXTUM',
    intro: 'En TEXTUM no intervenimos solo al final del proceso. Trabajamos desde la arquitectura metodológica de cada proyecto para ayudarte a tomar mejores decisiones, fortalecer tu manuscrito y sostener tu investigación con mayor claridad, rigor y seguridad académica.',
    closing: 'Nuestro acompañamiento no se limita a corregir un texto: fortalece todo el proceso académico y tu capacidad como autor para avanzar con criterio propio y rigor académico.',
    steps: [
      {
        n: '01',
        title: 'Diagnóstico',
        desc: 'Evaluamos el estado real de tu proyecto, identificamos fortalezas, vacíos y prioridades, y definimos la ruta de acompañamiento más adecuada.',
      },
      {
        n: '02',
        title: 'Arquitectura metodológica',
        desc: 'Ordenamos la lógica de tu investigación para alinear problema, objetivos, marco teórico, metodología, resultados y conclusiones.',
      },
      {
        n: '03',
        title: 'Optimización científica',
        desc: 'Fortalecemos redacción, coherencia, argumentación, citación y adaptación a estándares académicos internacionales.',
      },
      {
        n: '04',
        title: 'Autonomía del autor',
        desc: 'Nuestro objetivo no es sustituirte, sino ayudarte a desarrollar criterio y dominio metodológico para defender tus decisiones con solvencia.',
      },
    ],
  },
  en: {
    eyebrow: 'TEXTUM Method',
    title: 'How TEXTUM works',
    intro: 'At TEXTUM we don´t only intervene at the end of the process. We work from the methodological architecture of each project to help you make better decisions, strengthen your manuscript and sustain your research with greater clarity, rigour and academic confidence.',
    closing: 'Our support is not limited to correcting a text: it strengthens the entire academic process and your capacity as an author to advance with your own informed judgement and academic rigour.',
    steps: [
      {
        n: '01',
        title: 'Diagnosis',
        desc: 'We evaluate the real state of your project, identify strengths, gaps and priorities, and define the most appropriate support pathway.',
      },
      {
        n: '02',
        title: 'Methodological architecture',
        desc: 'We organise the logic of your research to align problem, objectives, theoretical framework, methodology, results and conclusions.',
      },
      {
        n: '03',
        title: 'Scientific optimisation',
        desc: 'We strengthen writing, coherence, argumentation, citation and adaptation to international academic standards.',
      },
      {
        n: '04',
        title: 'Author autonomy',
        desc: 'Our goal is not to replace you, but to help you develop judgement and methodological mastery to defend your decisions with confidence.',
      },
    ],
  },
};

// ─── TABLA DE PRECIOS — datos para PricesTextum.tsx ─────────────────────────
export const PRICE_TABLE = [
  { line_es: 'Titulación',            line_en: 'Degree Projects',       program_es: 'Ajuste de Estilo y Norma',          program_en: 'Style & Standards Adjustment',    usd: 199, eur: 189 },
  { line_es: 'Titulación',            line_en: 'Degree Projects',       program_es: 'Mentoría Avanzada FLUX',            program_en: 'Advanced FLUX Mentoring',         usd: 349, eur: 329 },
  { line_es: 'Titulación',            line_en: 'Degree Projects',       program_es: 'Co-creación de Alta Intensidad',    program_en: 'High-Intensity Co-creation',      usd: 499, eur: 450 },
  { line_es: 'Publicación científica', line_en: 'Scientific Publication', program_es: 'Adaptación Editorial',             program_en: 'Editorial Adaptation',            usd: 299, eur: 279 },
  { line_es: 'Publicación científica', line_en: 'Scientific Publication', program_es: 'Pre-arbitraje Científico + FLUX',  program_en: 'Scientific Pre-review + FLUX',    usd: 499, eur: 450 },
  { line_es: 'Publicación científica', line_en: 'Scientific Publication', program_es: 'Acompañamiento Editorial Premium', program_en: 'Premium Editorial Mentoring',      usd: 799, eur: 750 },
  { line_es: 'Defensa académica',     line_en: 'Academic Defence',      program_es: 'Alta Defensa y Oratoria Académica', program_en: 'High Defence & Academic Oratory', usd: 120, eur: 110 },
];

export const PRICE_LEGAL = {
  es: 'Los valores pueden variar según extensión, complejidad, disciplina, plazo de entrega y etapa del manuscrito.',
  en: 'Prices may vary according to length, complexity, discipline, delivery deadline and stage of the manuscript.',
};

// ─── DIFERENCIALES — datos para WhyTextum.tsx ───────────────────────────────
export const WHY_TEXTUM = {
  es: {
    eyebrow: 'Nuestra diferencia',
    title: 'Por qué TEXTUM es diferente',
    body: 'TEXTUM está diseñado para quienes buscan un acompañamiento serio, técnicamente sólido y compatible con las exigencias actuales de la investigación académica internacional.',
    items: [
      'Mentoría académica real, no corrección superficial.',
      'Metodología propia orientada a rigor, claridad y autonomía intelectual.',
      'Integración ética de IA como apoyo metodológico y no como sustitución de autoría.',
      'Acompañamiento alineado con estándares internacionales (APA 7 · IMRyD · Scopus · ANECA · Bologna).',
      'Equipo con validadores científicos visibles y trayectoria académica internacional.',
    ],
  },
  en: {
    eyebrow: 'Our difference',
    title: 'Why TEXTUM is different',
    body: 'TEXTUM is designed for those seeking serious, technically sound support that is compatible with the current demands of international academic research.',
    items: [
      'Real academic mentoring, not superficial correction.',
      'Our own methodology oriented towards rigour, clarity and intellectual autonomy.',
      'Ethical integration of AI as methodological support, not a substitute for authorship.',
      'Support aligned with international standards (APA 7 · IMRaD · Scopus · ANECA · Bologna).',
      'Team with visible scientific validators and international academic track record.',
    ],
  },
};

// ─── CTA FINAL — datos para la sección final ────────────────────────────────
export const FINAL_CTA = {
  es: {
    title: 'Conversemos sobre tu investigación',
    body: 'Cada proyecto plantea desafíos distintos. Cuéntanos en qué etapa te encuentras y te orientaremos hacia el programa más adecuado según tu nivel académico, tu objetivo y el tipo de acompañamiento que realmente necesitas.',
    cta: 'Reservar mi diagnóstico académico',
    micro: 'Una primera conversación puede ayudarte a identificar el nivel de rigor técnico, metodológico y editorial que necesita tu proyecto.',
  },
  en: {
    title: 'Let\'s talk about your research',
    body: 'Every project presents different challenges. Tell us what stage you are at and we will guide you towards the most appropriate programme according to your academic level, your objective and the type of support you really need.',
    cta: 'Book my academic diagnosis',
    micro: 'An initial conversation can help you identify the level of technical, methodological and editorial rigour your project needs.',
  },
};
