export type ApiMethods = "get" | "post" | "put" | "delete" | "patch";
export const apiMethods: ApiMethods[] = [
  "get",
  "post",
  "put",
  "delete",
  "patch",
];
export interface PathParameter {
  name: string;
  in: "path";
  description?: string;
  required?: boolean;
  schema: ReferenceSchema | StandardSchema;
}
export interface QueryParameter {
  name: string;
  in: "query";
  description?: string;
  required?: boolean;
  schema: Schema;
}
export type Parameter = PathParameter | QueryParameter;
export interface Specification {
  paths?: {
    [url: string]: {
      [method in ApiMethods]: {
        operationId: string;
        parameters?: Array<Parameter>;
        requestBody?: {
          content?: {
            "application/json"?: {
              schema?: Schema;
            };
          };
        };
        responses?: {
          [statusCode: number]: {
            content?: {
              "application/json"?: {
                schema?: Schema;
              };
            };
          };
        };
      };
    };
  };
  components?: {
    schemas: {
      [schema: string]: Schema;
    };
  };
}

export type Schema =
  | StandardSchema
  | ArraySchema
  | ObjectSchema
  | ReferenceSchema;

export interface StandardSchema {
  type: "string" | "number" | "integer" | "boolean";
  default?: string;
  enum?: string[];
  description?: string;
  example?: string | number | boolean;
}

export interface ArraySchema {
  type: "array";
  items: Schema;
}

export interface ObjectSchema {
  type: "object";
  properties: { [url: string]: Schema };
  required?: Array<string>;
}

export interface ReferenceSchema {
  $ref: string;
}
