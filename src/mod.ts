import { commands } from "../deps.ts";
import { generateDenoOakRouter } from "./generate/server/deno-oak/generate.ts";
import { parseFiles } from "./generate/core/parse-files.ts";
import { alreadyExistsCheck } from "./util/already-exists-check.ts";
import { generateFetchClient } from "./generate/client/fetch/generate.ts";

const cli = commands("aoenyx-api-gen");

cli
  .command(
    "interfaces [appPath] [...filePaths]",
    "Generate a set of typescript interfaces",
  )
  .option("--force", "Force the creation, deleting the given path if necessary")
  .option("--tsImportSuffix", "Use a '.ts' on import statements (deno)")
  .action(
    (
      appPath: string,
      filePaths: string[],
      options: { force: boolean; tsImportSuffix: boolean },
    ) => {
      alreadyExistsCheck(appPath, options.force);
      parseFiles(appPath, filePaths, options.tsImportSuffix);
    },
  );

cli
  .command(
    "deno-oak-server [appPath] [...filePaths]",
    "Generate a router and interfaces for use with deno and oak",
  )
  .option("--force", "Force the creation, deleting the given path if necessary")
  .action(
    (appPath: string, filePaths: string[], options: { force: boolean }) => {
      alreadyExistsCheck(appPath, options.force);
      const pathData = parseFiles(appPath, filePaths, true);
      generateDenoOakRouter(appPath, pathData, true);
    },
  );

cli
  .command(
    "fetch-client [appPath] [...filePaths]",
    "Generate a client service and interfaces for use fetch",
  )
  .option("--force", "Force the creation, deleting the given path if necessary")
  .option("--tsImportSuffix", "Use a '.ts' on import statements (deno)")
  .action(
    (
      appPath: string,
      filePaths: string[],
      options: { force: boolean; tsImportSuffix: boolean },
    ) => {
      alreadyExistsCheck(appPath, options.force);
      const pathData = parseFiles(appPath, filePaths, options.tsImportSuffix);
      generateFetchClient(appPath, pathData, options.tsImportSuffix);
    },
  );

cli.help();
cli.parse();
