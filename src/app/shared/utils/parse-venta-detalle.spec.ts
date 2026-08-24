import { parseVentaDetalle } from './parse-venta-detalle';

describe('parseVentaDetalle', () => {
  it('parses quantity prefixes and plain product names', () => {
    expect(parseVentaDetalle('2× Cookie Bon o Bon · Brownie')).toEqual([
      { cantidad: 2, nombre: 'Cookie Bon o Bon' },
      { cantidad: 1, nombre: 'Brownie' },
    ]);
  });

  it('returns empty array for blank detalle', () => {
    expect(parseVentaDetalle('   ')).toEqual([]);
  });
});
