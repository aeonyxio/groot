import { join } from "https://deno.land/std@0.114.0/path/win32.ts";
import { ApiMethods, Endpoint, Schema } from "../../types/specification.ts";
import { capitalizeFirstLetter } from "../../util/casing.ts";
import { writeInterface } from "../../util/write-interface.ts";
import { createType } from "./create-dto.ts";

const createSchema = ({
  schema,
  operationId,
  appPath,
  objectName,
  fileName,
}: {
  schema: Schema | undefined;
  operationId: string;
  appPath: string;
  objectName: string;
  fileName: string;
}):
  | undefined
  | {
      type: string;
      path: string;
    } => {
  let references: undefined | { type: string; path: string } = undefined;
  if (schema) {
    references = {
      type: `${capitalizeFirstLetter(operationId)}${objectName}`,
      path: `interfaces/operations/${operationId}/${fileName}`,
    };
    const { code } = createType({
      name: references.type,
      schema: schema,
      depth: 0,
      semiColon: true,
      importPathPrefix: "../../common",
    });

    writeInterface(join(appPath, references.path), code);
  }
  return references;
};

export const parsePath = (
  appPath: string,
  url: string,
  method: ApiMethods,
  rawEndpoint: Endpoint
) => {
  const { operationId } = rawEndpoint;

  const pathParams = createSchema({
    schema: rawEndpoint?.pathParams,
    operationId,
    appPath,
    objectName: "PathParams",
    fileName: "path-params.ts",
  });

  const queryParams = createSchema({
    schema: rawEndpoint?.queryParams,
    operationId,
    appPath,
    objectName: "QueryParams",
    fileName: "query-params.ts",
  });

  const requestBody = createSchema({
    schema: rawEndpoint?.requestBody,
    operationId,
    appPath,
    objectName: "RequestDto",
    fileName: "request-body.ts",
  });

  const responseBody = createSchema({
    schema: rawEndpoint?.responseBody,
    operationId,
    appPath,
    objectName: "ResponseDto",
    fileName: "response-body.ts",
  });

  return {
    method,
    url,
    operationId,
    pathParams: pathParams,
    queryParams: queryParams,
    requestBody: requestBody,
    responseBody: responseBody,
  };
};
