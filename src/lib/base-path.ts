export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string) {
  if (!path.startsWith("/") || !BASE_PATH) return path;

  if (path === BASE_PATH || path.startsWith(`${BASE_PATH}/`)) {
    return path;
  }

  return path === "/" ? `${BASE_PATH}/` : `${BASE_PATH}${path}`;
}
