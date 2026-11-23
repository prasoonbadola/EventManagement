import Papa from "papaparse";
import { downloadFile } from "./calendar";

/**
 * Serializes rows into CSV with automatic RFC 4180 escaping and
 * spreadsheet formula injection protection (=, +, -, @).
 */
export const toCsv = (rows: (string | number)[][]): string => {
  const sanitized = rows.map((r) =>
    r.map((v) => {
      const s = String(v ?? "");
      return /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
    })
  );
  return Papa.unparse(sanitized, { newline: "\r\n" });
};

export const downloadCsv = (filename: string, rows: (string | number)[][]) =>
  downloadFile(filename, "\uFEFF" + toCsv(rows), "text/csv;charset=utf-8");
