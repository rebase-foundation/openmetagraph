const withTM = require("next-transpile-modules")([
  "openmetagraph",
  "omg-graphql",
]);

module.exports = withTM({
  reactStrictMode: true,
});
