import {
  GraphQLSchema,
  GraphQLString,
  GraphQLObjectType,
  GraphQLObjectTypeConfig,
  GraphQLOutputType,
  GraphQLFloat,
  GraphQLInputObjectType,
  GraphQLList,
  GraphQLError,
  GraphQLBoolean,
} from "graphql";
import { GraphQLJSONObject } from "graphql-type-json";

export const FileType = new GraphQLObjectType({
  name: "File",
  description: "A URI to a file somewhere else",
  fields: {
    contentType: {
      type: GraphQLString,
      description: "A mime type, like 'image/gif'",
    },
    uri: {
      type: GraphQLString,
      description: "A URI, like ipfs://mycid, or https://example.com/foo.gif",
    },
  },
});

export const StringSchemaInput = new GraphQLInputObjectType({
  name: "StringSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const NumberSchemaInput = new GraphQLInputObjectType({
  name: "NumberSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const FileSchemaInput = new GraphQLInputObjectType({
  name: "FileSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    types: {
      type: new GraphQLList(GraphQLString),
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const NodeSchemaInput = new GraphQLInputObjectType({
  name: "NodeSchemaInput",
  fields: {
    key: {
      type: GraphQLString,
    },
    schemas: {
      type: new GraphQLList(GraphQLString),
    },
    multiple: {
      type: GraphQLBoolean,
    },
  },
});

export const SchemaInputType = new GraphQLInputObjectType({
  name: "SchemaInput",
  description: "Input for creating a schema",
  fields: {
    files: {
      type: new GraphQLList(FileSchemaInput),
    },
    strings: {
      type: new GraphQLList(StringSchemaInput),
    },
    numbers: {
      type: new GraphQLList(NumberSchemaInput),
    },
    nodes: {
      type: new GraphQLList(NodeSchemaInput),
    },
  },
});

export const DocumentInputType = new GraphQLInputObjectType({
  name: "DocumentInput",
  description: "Input for creating a document",
  fields: {
    elements: {
      type: new GraphQLList(GraphQLJSONObject),
    },
    schemas: {
      type: new GraphQLList(GraphQLString),
    },
  },
});

export const CreateResponse = new GraphQLObjectType({
  name: "CreateResponse",
  fields: {
    key: {
      type: GraphQLString,
    },
  },
});
