import {
  registerAddPetFunction,
  registerDeleteUserFunction,
} from "./app/router.ts";

registerAddPetFunction(async ({ body }) => {
  return {};
});

registerDeleteUserFunction(() => {
  return { status: 200 };
});
