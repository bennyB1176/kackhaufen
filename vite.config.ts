import { defineConfig } from "vite";

// Project-Pages liegen unter https://<user>.github.io/kackhaufen/
// => base muss auf den Repo-Namen zeigen, damit Assets korrekt laden.
export default defineConfig({
  base: "/kackhaufen/",
  test: {
    globals: true,
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
});
