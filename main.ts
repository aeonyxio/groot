import { commands, YAML } from "./deps.ts";
import { extname, join } from "https://deno.land/std@0.156.0/path/mod.ts";
import { createType } from "./create-dto.ts";
import { capitalizeFirstLetter } from "./casing.ts";
import { apiMethods, Schema, Specification } from "./specification.types.ts";
import { writeInterface } from "./write-interface.ts";
import {
  importInterfaceForRouter,
  registerOperationsTemplate,
  routerTemplate,
  routeTemplate,
} from "./router-template.ts";

const isApiSchema = (path: string) =>
  path.endsWith("api.json") ||
  path.endsWith("api.yaml") ||
  path.endsWith("api.yml");

const getFileContents = async (path: string) => {
  const fileExt = extname(path).toLowerCase();
  const rawFileContents = await Deno.readTextFile(path);
  if (fileExt === ".json") {
    return JSON.parse(rawFileContents);
  } else {
    return YAML.parse(rawFileContents);
  }
};

const createSchema = ({
  schema,
  operationId,
  appPath,
  routeImports,
  objectName,
  fileName,
}: {
  schema: Schema | undefined;
  operationId: string;
  appPath: string;
  routeImports: Set<string>;
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
    routeImports.add(
      importInterfaceForRouter(references.type, `./${references.path}`)
    );
  }
  return references;
};

const cli = commands("aoenyx-open-api-gen");

cli
  .command("[appPath] [...filePaths]", "Open API YAML or JSON.")
  .action(async (appPath: string, filePaths: string[]) => {
    let routeCode = "";
    const routeImports = new Set<string>();
    const routeOperations = new Set<string>();

    try {
      Deno.removeSync(appPath, { recursive: true });
      // deno-lint-ignore no-empty
    } catch {}

    for (const filePath of filePaths) {
      const fileExt = extname(filePath).toLowerCase();
      if (fileExt !== ".json" && fileExt !== ".yaml" && fileExt !== ".yml") {
        console.error("The files must be a json or yaml format.");
        return;
      }

      if (isApiSchema(filePath)) {
        const specification = (await getFileContents(
          filePath
        )) as Specification;
        for (const url of Object.getOwnPropertyNames(specification.paths)) {
          for (const method of apiMethods) {
            const rawEndpoint = specification.paths?.[url][method];
            if (!rawEndpoint) {
              continue;
            }

            const { operationId } = rawEndpoint;

            const pathParams = createSchema({
              schema: rawEndpoint?.pathParams,
              operationId,
              appPath,
              routeImports,
              objectName: "PathParams",
              fileName: "path-params.ts",
            });

            const queryParams = createSchema({
              schema: rawEndpoint?.queryParams,
              operationId,
              appPath,
              routeImports,
              objectName: "QueryParams",
              fileName: "query-params.ts",
            });

            const requestBody = createSchema({
              schema: rawEndpoint?.requestBody,
              operationId,
              appPath,
              routeImports,
              objectName: "RequestDto",
              fileName: "request-body.ts",
            });

            const responseBody = createSchema({
              schema: rawEndpoint?.responseBody,
              operationId,
              appPath,
              routeImports,
              objectName: "ResponseDto",
              fileName: "response-body.ts",
            });

            routeOperations.add(
              registerOperationsTemplate({
                operationId,
                pathParamsType: pathParams?.type,
                queryParamsType: queryParams?.type,
                requestBodyType: requestBody?.type,
                responseBodyType: responseBody?.type,
              })
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
          routeCode
        );
        writeInterface(join(appPath, `router.ts`), routerCode);
      } else {
        const specification = (await getFileContents(filePath)) as Record<
          string,
          Schema
        >;
        for (const schemaName of Object.getOwnPropertyNames(specification)) {
          const name = capitalizeFirstLetter(schemaName);
          const { code } = createType({
            name,
            schema: specification[schemaName],
            depth: 0,
            semiColon: true,
            importPathPrefix: ".",
          });

          writeInterface(join(appPath, `interfaces/common/${name}.ts`), code);
        }
      }
    }
  });

cli.help();
cli.parse();
