import { parsePrecio } from './parse-precio';

describe('parsePrecio', () => {
  it('returns null for empty or non-numeric values', () => {
    expect(parsePrecio(null)).toBeNull();
    expect(parsePrecio('')).toBeNull();
    expect(parsePrecio('Consultar')).toBeNull();
  });

  it('extracts digits from formatted prices', () => {
    expect(parsePrecio('$1.500')).toBe(1500);
    expect(parsePrecio('2500')).toBe(2500);
  });
});
