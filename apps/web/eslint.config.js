import { nextJsConfig } from "@repo/eslint-config/next-js";

/** @type {import("eslint").Linter.Config} */
export default {
  ...nextJsConfig,
  // Add your custom rules here
  rules: {
    ...nextJsConfig.rules,
    'react-hooks/exhaustive-deps': 'off',  // This disables the exhaustive-deps rule globally
  },
};
