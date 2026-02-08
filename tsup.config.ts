import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  clean: true,
  sourcemap: true,
  target: "esnext",
  minify: "terser",
  terserOptions: {
    compress: { passes: 2 },
  },
});
