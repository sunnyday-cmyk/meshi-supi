import type { MetadataRoute } from "next";

const BASE_URL = "https://meshi-supi.vercel.app";

type StaticRoute = {
  path: string;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

/** 公開用の静的ページ。ページ追加時はここに path を足す */
const staticRoutes: StaticRoute[] = [
  { path: "", changeFrequency: "weekly", priority: 1 },
  { path: "/session/new", changeFrequency: "monthly", priority: 0.8 }
];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return staticRoutes.map(({ path, changeFrequency, priority }) => ({
    url: `${BASE_URL}${path}`,
    lastModified,
    changeFrequency,
    priority
  }));
}
