import { FlatCompat } from "@eslint/eslintrc";

/**
 * ESLint 9 flat config.
 *
 * ── Why this exists ───────────────────────────────────────────────────────
 *
 * `next lint` was removed in Next 16, so `npm run lint` used to parse "lint"
 * as a directory and fail with `Invalid project directory provided`. The script
 * now runs ESLint's own CLI against this config, which is what the Next 16 docs
 * prescribe. `eslint-config-next` is still eslintrc-shaped, hence `FlatCompat`.
 *
 * ── Why it does not run yet ───────────────────────────────────────────────
 *
 * This project is on TypeScript 7.0, and `typescript-eslint` — which
 * `eslint-config-next` depends on — refuses to load against it:
 *
 *     typescript-eslint does not support TS 7.0.
 *     https://github.com/typescript-eslint/typescript-eslint/issues/10940
 *
 * There is no standalone TS 7 parser to substitute: `@typescript-eslint/parser`
 * will not install alongside TS 7 either (peer conflict). Downgrading
 * TypeScript to make the linter run would be a worse trade than having no
 * linter, so nothing here works around it.
 *
 * Nothing else needs to change when upstream support lands — `npm run lint`
 * will simply start working.
 */
const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

export default [
  {
    ignores: [".next/**", "node_modules/**", "next-env.d.ts", "**/*.tsbuildinfo"],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
];
