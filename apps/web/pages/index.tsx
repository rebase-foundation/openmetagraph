import Layout from "../components/Layout";

export default function Web() {
  return (
    <Layout>
      <article className="px-4 max-w-3xl m-auto pt-16 pb-24">
        <section className="pb-16">
          <h1>It's a metadata format for decentralized projects.</h1>
          <p>
            It lets you specify titles, photos, binary files, and other stuff in
            a way that a client can understand. It's typed and documents can
            refer to other documents. It looks like this:
          </p>

          <pre className="text-sm">
            {`{
  "object": "omg",
  "version": "0.1.0",
  "schemas": ["ipfs://QmbNa2CdaSbxs8KuJaY2ZaPRgVPjRdLdwgY2Z5Db4yoQhz"],
  "elements": [
    {
      "object": "string",
      "key": "title",
      "value": "My Cool Title"
    },
    {
      "object": "file",
      "key": "photos",
      "uri": "ipfs://some-cid"
    },
    {
      "object": "file",
      "key": "photos",
      "uri": "ipfs://another-cid"
    },
    {
      "object": "node",
      "key": "reference",
      "uri": "ipfs://QmbNa2CdaSbxs8KuJaY2ZaPRgVPjRdLdwgY2Z5Db4yoQhz"
    }
  ]
}`}
          </pre>
        </section>
        <section className="pb-16">
          <h1>You can query documents from GraphQL & IPFS</h1>
          <p>
            OpenMetaGraph documents can auto-generate a GraphQL API. Create your
            own{" "}
            <a href="https://github.com/rebase-foundation/openmetagraph">
              OpenMetaGraph gateway
            </a>
            , or use{" "}
            <a href="https://www.openmetagraph.com/api/graphql">
              a public one.
            </a>
          </p>

          <pre className="text-sm">
            {`{
  get(key: "ipfs://cid") {
      title
      photos {
        uri
        contentType
      }
  }
}`}
          </pre>
        </section>
      </article>
    </Layout>
  );
}
