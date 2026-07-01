export type Route = {
  path: string;
  priority: number;
  changefreq: "daily" | "weekly" | "monthly";
};

export const STATIC_ROUTES: Route[] = [
  { path: "", priority: 1, changefreq: "weekly" },
  { path: "/blog", priority: 0.9, changefreq: "daily" },
  { path: "/contacto", priority: 0.5, changefreq: "monthly" }
];