import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const pageScopeCompatibility = {
  postcssPlugin: "page-scope-compatibility",
  AtRule: {
    scope(atRule) {
      const match = atRule.params.match(/^\((.+)\)$/);
      if (!match) return;

      const scopeSelector = match[1].trim();

      atRule.walkRules((rule) => {
        let parent = rule.parent;

        while (parent && parent !== atRule) {
          if (
            parent.type === "atrule" &&
            parent.name.endsWith("keyframes")
          ) {
            return;
          }

          parent = parent.parent;
        }

        rule.selectors = rule.selectors.map((selector) => {
          const trimmed = selector.trim();

          if (
            trimmed.startsWith("body[") ||
            trimmed.startsWith("html") ||
            trimmed.startsWith(":root")
          ) {
            return trimmed;
          }

          return `${scopeSelector} ${trimmed}`;
        });
      });

      atRule.replaceWith(...atRule.nodes);
    },
  },
};

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [pageScopeCompatibility],
    },
  },
});
