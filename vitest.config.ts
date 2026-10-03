import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * Next turns `import logo from "x.png"` into StaticImageData ({ src, width, height }); Vite hands tests a bare URL
 * string, which next/image rejects for lacking dimensions. This gives tests the same shape, so components that
 * render real content (the footer's firm strip, the site chrome) work without every test stubbing images.
 */
const staticImages = {
  name: "static-image-data",
  enforce: "pre" as const,
  load(id: string) {
    if (!/\.(png|jpe?g|webp|avif|gif|svg)$/.test(id)) return null;
    return `export default { src: ${JSON.stringify(id)}, width: 96, height: 96 };`;
  },
};

export default defineConfig({
  plugins: [staticImages, react()],
  resolve: {
    alias: { "@": fileURLToPath(new URL("./", import.meta.url)) },
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests/**/*.test.{ts,tsx}"],
  },
});
