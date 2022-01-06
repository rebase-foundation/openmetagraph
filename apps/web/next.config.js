const withTM = require("next-transpile-modules")([
  "ui",
  "openmetagraph",
  "omg-graphql",
]);

module.exports = withTM({
  reactStrictMode: true,
});
