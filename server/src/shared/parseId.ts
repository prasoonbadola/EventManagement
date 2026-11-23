import { notFound } from "./errors";

/** Parse a numeric route param, or throw a 404 for the named resource. */
export function parseId(raw: unknown, what: string): number {
  const id = Number(String(raw));
  if (!Number.isInteger(id) || id < 1) throw notFound(what);
  return id;
}
