import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Descontala · Ofertas de tu barrio",
    short_name: "Descontala",
    description: "Las ofertas de los supermercados de tu barrio en Sevilla, con la fecha de fin siempre a la vista.",
    lang: "es-ES",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7f7f4",
    theme_color: "#f7f7f4",
    categories: ["shopping", "lifestyle"],
    icons: [
      { src: "/icons/192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Buscar producto", url: "/buscar" },
      { name: "Mis códigos", url: "/codigos" },
    ],
  };
}
