import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

// The plugin source uses extensionless relative imports (e.g. `./mapping`), which
// TypeScript's bundler resolution allows but Node's strict ESM loader does not.
// This resolve hook appends `.ts` to extensionless relative specifiers when a
// matching file exists, so `node --test` can run the TypeScript sources directly
// via Node's built-in type stripping, with no test-runner dependency required.
export async function resolve(specifier, context, nextResolve) {
  if (
    (specifier.startsWith("./") || specifier.startsWith("../")) &&
    !/\.[cm]?[jt]s$/.test(specifier) &&
    context.parentURL != null
  ) {
    const candidate = new URL(`${specifier}.ts`, context.parentURL);

    if (existsSync(fileURLToPath(candidate))) {
      return nextResolve(candidate.href, context);
    }
  }

  return nextResolve(specifier, context);
}
