/**
 * Firestore Utilities
 * Ensures objects sent to Firestore are free of `undefined` values,
 * which cause Firestore SDK `Function addDoc() called with invalid data` errors.
 */

export function cleanFirestoreData<T = any>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => cleanFirestoreData(item)) as unknown as T
  }

  if (typeof obj === 'object') {
    // Preserve Date and Firestore Timestamp/FieldValue objects
    if (
      obj instanceof Date ||
      (typeof (obj as any).toDate === 'function') ||
      (typeof (obj as any).isEqual === 'function' && '_methodName' in (obj as any)) ||
      (obj as any).constructor?.name === 'FieldValue' ||
      (obj as any).constructor?.name === 'Timestamp'
    ) {
      return obj
    }

    const cleaned: Record<string, any> = {}
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanFirestoreData(value)
      }
    }
    return cleaned as T
  }

  return obj
}
