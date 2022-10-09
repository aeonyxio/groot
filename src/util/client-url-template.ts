export const clientUrlTemplate = (url: string) => {
  return url.replace(/:([0-9a-zA-Z-]+)(?:(\/)|$)/g, "${params.$1}$2");
};
