export interface VentaDetalleItem {
  nombre: string;
  cantidad: number;
}

/** Parsea ventas.detalle: "2× Cookie Bon o Bon · Brownie" → items con cantidad. */
export function parseVentaDetalle(detalle: string | null | undefined): VentaDetalleItem[] {
  if (!detalle?.trim()) return [];

  return detalle
    .split('·')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const match = part.match(/^(\d+)\s*[×x]\s*(.+)$/i);
      if (match) {
        return {
          cantidad: Number(match[1]) || 1,
          nombre: match[2].trim(),
        };
      }
      return { cantidad: 1, nombre: part };
    });
}
