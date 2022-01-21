module.exports = {
  extends: ["next", "prettier"],
  settings: {
    next: {
      rootDir: ["apps/*/", "packages/*/"],
    },
  },
  rules: {
    "@next/next/no-html-link-for-pages": "off",
    "react/no-unescaped-entities": "off",
    "react/no-unknown-property": "off",
    "@next/next/no-page-custom-font": "off",
    "@next/next/no-html-link-for-pages": "off",
    "react/jsx-no-target-blank": "off",
  },
};
