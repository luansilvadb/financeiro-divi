export type Serialized<T> =
  T extends bigint ? number :
  T extends Date ? T :
  T extends ReadonlyArray<infer Item> ? Serialized<Item>[] :
  T extends object ? { [Key in keyof T]: Serialized<T[Key]> } :
  T;

export function serializeBigInt<T>(obj: T): Serialized<T> {
  if (obj === null || typeof obj !== 'object') {
    return (typeof obj === 'bigint' ? Number(obj) : obj) as Serialized<T>;
  }

  if (obj instanceof Date) return obj as Serialized<T>;

  if (Array.isArray(obj)) {
    return obj.map(serializeBigInt) as Serialized<T>;
  }

  const record = obj as Record<string, unknown>;
  const serialized: Record<string, unknown> = {};
  for (const key in record) {
    if (Object.prototype.hasOwnProperty.call(record, key)) {
      serialized[key] = serializeBigInt(record[key]);
    }
  }
  return serialized as Serialized<T>;
}
