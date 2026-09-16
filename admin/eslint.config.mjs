import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      // Async request effects explicitly reset page-level loading state before
      // starting their external request. The rule flags that intentional state
      // transition even though it is not a derived-state update.
      "react-hooks/set-state-in-effect": "off",
      // Query objects are rebuilt from URLSearchParams on every render; effects
      // depend on the stable searchParams object to avoid fetch loops.
      "react-hooks/exhaustive-deps": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
);
