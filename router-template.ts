import { capitalizeFirstLetter } from "./casing.ts";

export const routerTemplate = (
  imports: string,
  operations: string,
  routes: string
) =>
  `\
import { Router } from "https://deno.land/x/oak@v11.1.0/mod.ts";
import { getQuery } from "https://deno.land/x/oak@v11.1.0/helpers.ts";
${imports}

${operations}

export const router = new Router();
router${routes};
`;

export const importInterfaceForRouter = (
  interfaceName: string,
  path: string
) => {
  return `import { ${interfaceName} } from '${path}';`;
};

export const registerOperationsTemplate = ({
  operationId,
  pathParamsType,
  queryParamsType,
  requestBodyType,
  responseBodyType,
  requestHeadersType,
  responseHeadersType,
}: {
  operationId: string;
  pathParamsType?: string;
  queryParamsType?: string;
  requestBodyType?: string;
  responseBodyType?: string;
  requestHeadersType?: string;
  responseHeadersType?: string;
}) => {
  const fnName = `${capitalizeFirstLetter(operationId)}Function`;
  const inputs: string[] = [];
  const outputs: string[] = [];
  if (pathParamsType) inputs.push(`    params: ${pathParamsType};`);
  if (queryParamsType) inputs.push(`    query: ${queryParamsType};`);
  if (requestHeadersType) inputs.push(`    headers: ${requestHeadersType};`);
  if (requestBodyType) inputs.push(`    body: ${requestBodyType};`);
  if (responseHeadersType) outputs.push(`    headers: ${responseHeadersType};`);
  if (responseBodyType) outputs.push(`    body: ${responseBodyType};`);
  return `
type ${fnName} = (args: ${
    inputs.length
      ? `{
${inputs.join("\n")}
}`
      : "Record<never, never>"
  }) => {
${outputs.join("\n")}
    status?: number;
} | Promise<{
${outputs.join("\n")}
    status?: number;
}>${outputs.length ? "" : " | void"};

let ${operationId}: ${fnName} | undefined = undefined;

export const register${fnName} = (fn: ${fnName}) => {
    ${operationId} = fn;
};
`;
};

const requestBody = (requestBodyType: string) => {
  return `(await context.request.body({ type: "json" }).value) as ${requestBodyType}`;
};

const requestHeaders = (requestHeadersType: string) => {
  return `context.request.headers as ${requestHeadersType}`;
};

export const routeTemplate = ({
  method,
  url,
  operationId,
  pathParamsType,
  queryParamsType,
  requestBodyType,
  responseBodyType,
  requestHeadersType,
  responseHeadersType,
}: {
  method: string;
  url: string;
  operationId: string;
  pathParamsType?: string;
  queryParamsType?: string;
  requestBodyType?: string;
  responseBodyType?: string;
  requestHeadersType?: string;
  responseHeadersType?: string;
}) => {
  const fnName = operationId;
  const inputs: string[] = [];
  const outputs: string[] = [];
  if (pathParamsType) inputs.push(`params: context.params,`);
  if (queryParamsType) {
    inputs.push(`query: getQuery(context) as ${queryParamsType},`);
  }
  if (requestHeadersType) {
    inputs.push(`headers: ${requestHeaders(requestHeadersType)},`);
  }
  if (requestBodyType) inputs.push(`body: ${requestBody(requestBodyType)},`);
  if (responseHeadersType) {
    outputs.push("context.response.headers = res.headers;");
  }
  if (responseBodyType) outputs.push("context.response.body = res.body;");
  const pathGeneric = pathParamsType ? `<${pathParamsType}>` : "";
  const fixedUrl = url.replace("}", "").replace("{", ":");
  return `
    .${method}${pathGeneric}("${fixedUrl}", async (context) => {
        if(!${fnName}) {
            context.response.status = 501;
            return;
        }
        const res = await ${fnName}({
            ${inputs.join("\n            ")}
        });
        ${outputs.join("\n        ")}
        if(res?.status !== undefined) context.response.status = res.status;
    })`;
};
