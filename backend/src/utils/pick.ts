/**
 * Pick specific keys from an object (e.g. query parameters).
 * Ignores undefined or empty string values.
 */
export const pick = <T extends Record<string, any>, K extends keyof T>(
  obj: T,
  keys: readonly K[] | K[]
): Partial<Pick<T, K>> => {
  const finalObj: Partial<Pick<T, K>> = {};

  if (!obj || typeof obj !== "object") {
    return finalObj;
  }

  for (const key of keys) {
    if (
      Object.prototype.hasOwnProperty.call(obj, key) &&
      obj[key] !== undefined &&
      obj[key] !== ""
    ) {
      finalObj[key] = obj[key];
    }
  }

  return finalObj;
};

export default pick;
