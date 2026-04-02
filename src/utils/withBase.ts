export function withBase(path: string): string {
  const base = import.meta.env.BASE_URL || "/";
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;

  if (normalizedBase === "/") return normalizedPath;
  if (normalizedPath === "/") return normalizedBase;

  return `${normalizedBase.replace(/\/$/, "")}${normalizedPath}`;
}
