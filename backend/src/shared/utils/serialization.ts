/**
 * Recursively converts BigInt values to Numbers within an object or array.
 * This version maintains purity (no mutation) while optimizing traversal performance.
 *
 * @param obj The object or array to serialize
 * @returns A new object/array with BigInts converted to Numbers
 */
export function serializeBigInt(obj: any): any {
  // Fast path for null, undefined, and non-object primitives
  if (obj === null || typeof obj !== 'object') {
    return typeof obj === 'bigint' ? Number(obj) : obj;
  }

  // Preserve Date objects (fixes bug where they became empty objects)
  if (obj instanceof Date) return obj;

  // Clone and process arrays
  if (Array.isArray(obj)) {
    const len = obj.length;
    const newArr = new Array(len);
    for (let i = 0; i < len; i++) {
      newArr[i] = serializeBigInt(obj[i]);
    }
    return newArr;
  }

  // Clone and process objects using a more efficient loop than Object.keys().map()
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[key] = serializeBigInt(obj[key]);
    }
  }

  return newObj;
}
