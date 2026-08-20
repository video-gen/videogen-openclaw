import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["index.ts"],
  format: ["esm"],
  target: "node20",
  tsconfig: "./tsconfig.json",
  dts: false,
  splitting: false,
  sourcemap: true,
  clean: true,
  outDir: "dist",
  // Leave runtime/peer deps to the installer. OpenClaw loads this as an
  // installed package and must resolve `openclaw` from the host.
  external: ["openclaw", "@videogen/sdk", "typebox"],
});
