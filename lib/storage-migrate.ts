const MIGRATED_FLAG = 'loreheim_storage_migrated'

/** Один раз переносит localStorage loreforge_* → loreheim_* */
export function migrateLegacyStorageKeys() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(MIGRATED_FLAG)) return

  const legacyKeys: string[] = []
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i)
    if (key?.startsWith('loreforge_')) legacyKeys.push(key)
  }

  for (const oldKey of legacyKeys) {
    const newKey = `loreheim_${oldKey.slice('loreforge_'.length)}`
    if (!localStorage.getItem(newKey)) {
      const value = localStorage.getItem(oldKey)
      if (value !== null) localStorage.setItem(newKey, value)
    }
    localStorage.removeItem(oldKey)
  }

  localStorage.setItem(MIGRATED_FLAG, '1')
}
