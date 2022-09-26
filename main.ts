import { commands, YAML } from "./deps.ts";
import { extname, join } from "https://deno.land/std@0.156.0/path/mod.ts";
import { createParamType, createType } from "./create-dto.ts";
import { capitalizeFirstLetter } from "./casing.ts";
import { apiMethods, Specification } from "./specification.types.ts";
import { writeInterface } from "./write-interface.ts";
import {
  importInterfaceForRouter,
  registerOperationsTemplate,
  routerTemplate,
  routeTemplate,
} from "./router-template.ts";

const cli = commands("aoenyx-open-api-gen");

cli
  .command("[filePath] [appPath]", "Open API YAML or JSON.")
  .action(async (filePath: string, appPath: string) => {
    let routeCode = "";
    const routeImports = new Set<string>();
    const routeOperations = new Set<string>();
    const fileExt = extname(filePath).toLowerCase();
    if (fileExt !== ".json" && fileExt !== ".yaml" && fileExt !== ".yml") {
      console.error("The file must be a json or yaml format.");
      return;
    }
    const rawFileContents = await Deno.readTextFile(filePath);

    let specification: Specification;

    if (fileExt === ".json") {
      specification = JSON.parse(rawFileContents);
    } else {
      specification = YAML.parse(rawFileContents);
    }

    try {
      Deno.removeSync(appPath, { recursive: true });
      // deno-lint-ignore no-empty
    } catch {}

    if (specification?.components?.schemas) {
      for (
        const schemaName of Object.getOwnPropertyNames(
          specification.components.schemas,
        )
      ) {
        const name = capitalizeFirstLetter(schemaName);
        const { code } = createType({
          name,
          schema: specification.components.schemas[schemaName],
          depth: 0,
          semiColon: true,
          importPathPrefix: ".",
        });

        writeInterface(join(appPath, `interfaces/common/${name}.ts`), code);
      }
    }
    for (const url of Object.getOwnPropertyNames(specification.paths)) {
      for (const method of apiMethods) {
        const rawEndpoint = specification.paths?.[url][method];
        if (!rawEndpoint) {
          continue;
        }

        const { operationId } = rawEndpoint;
        const pathParamsRaw = rawEndpoint?.parameters?.filter(
          (p) => p.in === "path",
        );
        const queryParamsRaw = rawEndpoint?.parameters?.filter(
          (p) => p.in === "query",
        );
        const requestBodyRaw = rawEndpoint?.requestBody?.content
          ?.["application/json"]?.schema;
        const responseBodyRaw = rawEndpoint?.responses?.["200"]?.content
          ?.["application/json"]
          ?.schema;
        let requestBody:
          | undefined
          | {
            type: string;
            path: string;
          } = undefined;
        let responseBody:
          | undefined
          | {
            type: string;
            path: string;
          } = undefined;
        let pathParams:
          | undefined
          | {
            type: string;
            path: string;
          } = undefined;
        let queryParams:
          | undefined
          | {
            type: string;
            path: string;
          } = undefined;

        if (pathParamsRaw?.length) {
          pathParams = {
            type: `${capitalizeFirstLetter(operationId)}RequestDto`,
            path: `interfaces/operations/${operationId}/request.ts`,
          };
          const { code } = createParamType({
            name: pathParams.type,
            parameters: pathParamsRaw,
            importPathPrefix: "../../common",
          });

          writeInterface(join(appPath, pathParams.path), code);
          routeImports.add(
            importInterfaceForRouter(pathParams.type, `./${pathParams.path}`),
          );
        }
        if (queryParamsRaw?.length) {
          queryParams = {
            type: `${capitalizeFirstLetter(operationId)}PathParamsDto`,
            path: `interfaces/operations/${operationId}/query-params.ts`,
          };
          const { code } = createParamType({
            name: queryParams.type,
            parameters: queryParamsRaw,
            importPathPrefix: "../../common",
          });

          writeInterface(join(appPath, queryParams.path), code);
          routeImports.add(
            importInterfaceForRouter(queryParams.type, `./${queryParams.path}`),
          );
        }
        if (requestBodyRaw) {
          requestBody = {
            type: `${capitalizeFirstLetter(operationId)}QueryParamsDto`,
            path: `interfaces/operations/${operationId}/path-params.ts`,
          };
          const { code } = createType({
            name: requestBody.type,
            schema: requestBodyRaw,
            depth: 0,
            semiColon: true,
            importPathPrefix: "../../common",
          });

          writeInterface(join(appPath, requestBody.path), code);
          routeImports.add(
            importInterfaceForRouter(requestBody.type, `./${requestBody.path}`),
          );
        }
        if (responseBodyRaw) {
          responseBody = {
            type: `${capitalizeFirstLetter(operationId)}ResponseDto`,
            path: `interfaces/operations/${operationId}/response.ts`,
          };
          const { code } = createType({
            name: responseBody.type,
            schema: responseBodyRaw,
            depth: 0,
            semiColon: true,
            importPathPrefix: "../../common",
          });

          writeInterface(join(appPath, responseBody.path), code);
          routeImports.add(
            importInterfaceForRouter(
              responseBody.type,
              `./${responseBody.path}`,
            ),
          );
        }

        routeOperations.add(
          registerOperationsTemplate({
            operationId,
            pathParamsType: pathParams?.type,
            queryParamsType: queryParams?.type,
            requestBodyType: requestBody?.type,
            responseBodyType: responseBody?.type,
          }),
        );

        routeCode += routeTemplate({
          method,
          url,
          operationId,
          pathParamsType: pathParams?.type,
          queryParamsType: queryParams?.type,
          requestBodyType: requestBody?.type,
          responseBodyType: responseBody?.type,
        });
      }
    }

    const routerCode = routerTemplate(
      Array.from(routeImports).join("\n"),
      Array.from(routeOperations).join("\n"),
      routeCode,
    );
    writeInterface(join(appPath, `router.ts`), routerCode);
  });

cli.help();
cli.parse();
