import { serializeBigInt } from './serialization';

describe('serializeBigInt', () => {
  it('should convert BigInt to Number', () => {
    const input = { a: 1n, b: { c: 2n } };
    const output = serializeBigInt(input);
    expect(output.a).toBe(1);
    expect(typeof output.a).toBe('number');
    expect(output.b.c).toBe(2);
    expect(typeof output.b.c).toBe('number');
  });

  it('should preserve Date objects', () => {
    const now = new Date();
    const input = { date: now };
    const output = serializeBigInt(input);
    expect(output.date).toBeInstanceOf(Date);
    expect(output.date.getTime()).toBe(now.getTime());
  });

  it('should handle arrays (purely)', () => {
    const input = [1n, 2n, 3n];
    const output = serializeBigInt(input);
    expect(output).not.toBe(input); // Check for purity
    expect(output).toEqual([1, 2, 3]);
    expect(input[0]).toBe(1n); // Original should be untouched
  });

  it('should handle nested structures (purely)', () => {
    const nested = { x: 10n };
    const input = { a: nested };
    const output = serializeBigInt(input);
    expect(output).not.toBe(input);
    expect(output.a).not.toBe(nested);
    expect(output.a.x).toBe(10);
    expect(nested.x).toBe(10n); // Original should be untouched
  });

  it('should return null or undefined as is', () => {
    expect(serializeBigInt(null)).toBeNull();
    expect(serializeBigInt(undefined)).toBeUndefined();
  });

  it('should handle primitive types', () => {
    expect(serializeBigInt(123)).toBe(123);
    expect(serializeBigInt("test")).toBe("test");
    expect(serializeBigInt(true)).toBe(true);
    expect(serializeBigInt(10n)).toBe(10);
  });
});
