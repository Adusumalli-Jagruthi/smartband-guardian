export const seo = (title: string, description: string) => ({
  meta: [
    { title: `${title} | SmartBand` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} | SmartBand` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});
