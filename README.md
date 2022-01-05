# OpenMetaGraph

OpenMetaGraph format (OMG) is an extensible metadata format for decentralized projects.

## An example document

```json
{
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
