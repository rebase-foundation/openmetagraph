const withTM = require("next-transpile-modules")([
  "openmetagraph",
  "openmetagraph-graphql",
]);

module.exports = withTM({
  reactStrictMode: true,
  redirects: async () => {
    return [
      {
        source: "/studio",
        destination: "/schemas",
        permanent: true,
      },
    ];
  },
});
