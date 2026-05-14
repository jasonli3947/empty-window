import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

/** GitHub Pages 项目页为 /<仓库名>/，由 CI 注入 VITE_BASE_PATH，例如 /empty-window/ */
function baseUrl() {
  const raw = process.env.VITE_BASE_PATH?.trim();
  if (!raw || raw === "/") return "/";
  return raw.endsWith("/") ? raw : `${raw}/`;
}

export default defineConfig({
  base: baseUrl(),
  plugins: [react()],
  publicDir: "public",
});