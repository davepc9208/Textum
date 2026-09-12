export type Route = {
  path: string;
  priority: number;
  changefreq: 'daily' | 'weekly' | 'monthly';
};

export const STATIC_ROUTES: Route[] = [
  { path: '', priority: 1, changefreq: 'weekly' },
  { path: '/blog', priority: 0.9, changefreq: 'weekly' },
  { path: '/colecciones', priority: 0.8, changefreq: 'weekly' },
  { path: '/colecciones/principio', priority: 0.7, changefreq: 'monthly' },
  { path: '/colecciones/categoria', priority: 0.7, changefreq: 'monthly' },
  { path: '/colecciones/herramienta', priority: 0.7, changefreq: 'monthly' },
  { path: '/colecciones/eii', priority: 0.7, changefreq: 'monthly' },
  { path: '/privacidad', priority: 0.3, changefreq: 'monthly' },
  { path: '/casos', priority: 0.7, changefreq: 'monthly' },
];
