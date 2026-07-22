// src/data/colecciones.ts
export const COLECCIONES = [
  {
    id: 'filosofia-metodo',
    title: 'Filosofía y Método TEXTUM',
    description: 'Fundamentos epistemológicos y metodológicos de la investigación académica',
    slug: 'filosofia-metodo'
  },
  {
    id: 'rigor-escritura',
    title: 'Rigor y Escritura Científica',
    description: 'Técnicas avanzadas para la redacción académica y científica',
    slug: 'rigor-escritura'
  },
  {
    id: 'sustentacion-defensa',
    title: 'Sustentación y Defensa Oral',
    description: 'Estrategias para la defensa exitosa de tesis y trabajos de investigación',
    slug: 'sustentacion-defensa'
  },
] as const;

export type ColeccionId = typeof COLECCIONES[number]['id'];
