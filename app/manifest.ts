import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "House of Doms",
    short_name: "House",
    description: "Private House OS für Dom/Domina und Sub/Sklave",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#090708",
    theme_color: "#7d101c",
    orientation: "portrait-primary",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }]
  };
}
