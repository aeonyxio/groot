import { commands } from "../deps.ts";
import { generateDenoOakRouter } from "./generate/server/deno-oak/generate.ts";
import { parseFiles } from "./generate/core/parse-files.ts";
import { alreadyExistsCheck } from "./util/already-exists-check.ts";
import { generateFetchClient } from "./generate/client/fetch/generate.ts";

const cli = commands("aoenyx-api-gen");

cli
  .command(
    "interfaces [appPath] [...filePaths]",
    "Generate a set of typescript interfaces"
  )
  .option("--force", "Force the creation, deleting the given path if necessary")
  .action(
    (appPath: string, filePaths: string[], options: { force: boolean }) => {
      alreadyExistsCheck(appPath, options.force);
      parseFiles(appPath, filePaths);
    }
  );

cli
  .command(
    "deno-oak-server [appPath] [...filePaths]",
    "Generate a router and interfaces for use with deno and oak"
  )
  .option("--force", "Force the creation, deleting the given path if necessary")
  .action(
    (appPath: string, filePaths: string[], options: { force: boolean }) => {
      alreadyExistsCheck(appPath, options.force);
      const pathData = parseFiles(appPath, filePaths);
      generateDenoOakRouter(appPath, pathData);
    }
  );

cli
  .command(
    "fetch-client [appPath] [...filePaths]",
    "Generate a client service and interfaces for use fetch"
  )
  .option("--force", "Force the creation, deleting the given path if necessary")
  .action(
    (appPath: string, filePaths: string[], options: { force: boolean }) => {
      alreadyExistsCheck(appPath, options.force);
      const pathData = parseFiles(appPath, filePaths);
      generateFetchClient(appPath, pathData);
    }
  );

cli.help();
cli.parse();
