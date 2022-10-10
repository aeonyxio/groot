const exists = (filename: string): boolean => {
  try {
    Deno.statSync(filename);
    // successful, file or directory must exist
    return true;
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      // file or directory does not exist
      return false;
    } else {
      // unexpected error, maybe permissions, pass it along
      throw error;
    }
  }
};

export const alreadyExistsCheck = (appPath: string, force: boolean) => {
  const targetExists = exists(appPath);
  if (force && targetExists) {
    Deno.removeSync(appPath, { recursive: true });
  } else if (targetExists) {
    throw new Error(
      "Target directory already exists, use --force to force creation",
    );
  }
};
