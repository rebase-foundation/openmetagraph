# OpenMetaGraph

OpenMetaGraph format (OMG) is an extensible metadata format for decentralized projects.

- **Composable.** OMG allows disconnected topics share common metadata. For example, a co-working space and a video game might both have a “title” and “description”, but the co-working space might have a “location”, and the video game might have a “application” field. OMG allows client applications to implement support just for “title” and “description”, and provide “best effort” support for unfamiliar documents.
- **Infinitely Sized Documents.** OMG natively supports references to other documents, letting you only load what you need.
- **GraphQL friendly.** OMG can be easily be weaved into a GraphQL schema, which prevents the need for client applications to download yet another package to natively support a new decentralized protocol.


### An example document

```json
{
  "object": "omg",
  "version": "0.1.0",
  "schemas": ["ipfs://openmetagraph"],
  "elements": [
    {
      "object": "string",
      "key": "title",
      "value": "My Cool Title"
    },
    {
      "object": "file",
      "key": "photo",
      "contentType": "image/png",
      "uri": "ipfs://some-cid"
    },
    {
      "object": "file",
      "key": "photo",
      "contentType": "image/png",
      "uri": "ipfs://another-cid"
    },
    {
      "object": "node",
      "key": "versions",
      "uri": "ipfs://some-omg-document"
    }
  ]
}
```

### An example schema 

```json
{
  "object": "schema",
  "version": "0.1.0",
  "elements": {
    "title": {
      "object": "string",
      "multiple": false
    }, 
    "price": {
      "object": "number",
      "multiple": false
    },
    "photo": {
      "object": "file"
      "types": ["application/json"],
      "multiple": true
    },
    "versions": {
      "object": "node",
      "multiple": true,
      "schemas": ["my-schema"]
    }
  }
}
```

# GraphQL & IPFS 

OpenMetaGraph comes with a "gateway" node that anyone can run, that reads OMG schemas from IPFS, and then autogenerates graphql types for them. That way, client libraries can don't need to install new NPM packages, or learn a new API for every new dApp. 

```graphql
{
  document("somecid") {
    title
    description
    photo
    version {
      name
    }
  }
}
```

