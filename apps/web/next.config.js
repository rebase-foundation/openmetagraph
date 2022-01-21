const withTM = require("next-transpile-modules")([
  "openmetagraph",
  "openmetagraph-graphql",
]);

module.exports = withTM({
  reactStrictMode: true,
});
