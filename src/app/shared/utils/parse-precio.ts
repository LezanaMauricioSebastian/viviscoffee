/** Extrae un precio numérico positivo desde texto legacy (ej. "$1.500", "1500"). */
export function parsePrecio(precio: string | null | undefined): number | null {
  if (precio == null) return null;
  const digits = String(precio).replace(/[^\d]/g, '');
  if (!digits) return null;
  const n = Number(digits);
  return Number.isFinite(n) && n > 0 ? n : null;
}
