import { clientUrlTemplate } from "../../../util/client-url-template.ts";

export const template = (imports: string, operations: string) =>
  `\
${imports}
export class Api{
  baseUri = '';
  constructor(opts: {
    baseUri: string;
  }){
    this.baseUri = opts.baseUri;
  }
${operations}
}
`;

export const importInterfaceTemplate = (
  interfaceName: string,
  path: string,
  tsImportSuffix: boolean
) => {
  return `import type { ${interfaceName} } from '${path}${
    tsImportSuffix ? ".ts" : ""
  }';`;
};

export const operationsTemplate = ({
  method,
  url,
  operationId,
  pathParamsType,
  queryParamsType,
  requestBodyType,
  responseBodyType,
  requestHeadersType,
  responseHeadersType,
  fullyOptionalQueryParams,
  textResponseBody,
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
  fullyOptionalQueryParams: boolean;
  textResponseBody: boolean;
}) => {
  const fnName = operationId;
  let fnParamsAllOptional = true;
  let fnParamVars = "";
  let fnParamVarTypes = "";
  let fnReturnVars = "";
  let fnReturnVarTypes = "status:number;";
  let fetchOpts = "";
  let queryAssign = "";

  if (pathParamsType) {
    fnParamVars += `params,`;
    fnParamVarTypes += `params: ${pathParamsType};`;
    fnParamsAllOptional = false;
  }

  if (queryParamsType) {
    fnParamVars += `query,`;
    fnParamVarTypes += `query${
      fullyOptionalQueryParams ? "?" : ""
    }: ${queryParamsType};`;
    queryAssign = `\${query ? \`?\${new URLSearchParams(query)}\`: ''}`;
    if (!fullyOptionalQueryParams) fnParamsAllOptional = false;
  }

  if (requestBodyType) {
    fnParamVars += `body,`;
    fnParamVarTypes += `body: ${requestBodyType};`;
    fetchOpts += "body,";
    fnParamsAllOptional = false;
  }

  if (requestHeadersType) {
    fnParamVars += `headers,`;
    fnParamVarTypes += `headers: ${requestHeadersType};`;
    fetchOpts += "headers,";
    fnParamsAllOptional = false;
  }

  if (responseBodyType) {
    fnReturnVarTypes += `body: ${responseBodyType};`;
    fnReturnVars += `body: await res.json(),`;
  }

  if (responseHeadersType) {
    fnReturnVarTypes += `headers: ${responseHeadersType};`;
    fnReturnVars += `headers: await res.headers,`;
  }

  return `\
  ${fnName} = async (${
    fnParamVarTypes === ""
      ? ""
      : `{
    ${fnParamVars}
  }: {${fnParamVarTypes}}${fnParamsAllOptional ? "={}" : ""}`
  }): Promise<{
    ${fnReturnVarTypes}
  }> => {
    const res = await fetch(\`\${this.baseUri}${clientUrlTemplate(
      url
    )}${queryAssign}\`,{
      method: '${method.toUpperCase()}'
      ${fetchOpts}
    });

		if (!res.ok) {
			throw new Error()
		}

    return {
      status: res.status,
      body: await res.${textResponseBody ? "text" : "json"}(),
    }
  }
`;
};
