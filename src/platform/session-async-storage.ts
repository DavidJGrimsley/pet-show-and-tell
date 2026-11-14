const PREFIX = 'pst.async.';
const memory = new Map<string, string>();

function storage() {
  try {
    if (typeof sessionStorage === 'undefined') {
      return undefined;
    }
    return sessionStorage;
  } catch {
    return undefined;
  }
}

function readRaw(key: string) {
  const prefixed = PREFIX + key;
  const session = storage();
  if (session) {
    try {
      const stored = session.getItem(prefixed);
      if (stored !== null) {
        memory.set(key, stored);
        return stored;
      }
    } catch {
      // Fall through to the in-memory copy.
    }
  }
  return memory.has(key) ? (memory.get(key) ?? null) : null;
}

function writeRaw(key: string, value: string) {
  memory.set(key, value);
  const session = storage();
  if (!session) {
    return;
  }
  const prefixed = PREFIX + key;
  try {
    session.setItem(prefixed, value);
  } catch {
    try {
      session.removeItem(prefixed);
    } catch {
      // Memory remains the source of truth for this tab.
    }
  }
}

function removeRaw(key: string) {
  memory.delete(key);
  const session = storage();
  if (!session) {
    return;
  }
  try {
    session.removeItem(PREFIX + key);
  } catch {
    // The in-memory entry is already gone.
  }
}

const AsyncStorage = {
  async getItem(key: string) {
    return readRaw(key);
  },
  async setItem(key: string, value: string) {
    writeRaw(key, value);
  },
  async removeItem(key: string) {
    removeRaw(key);
  },
  async mergeItem(key: string, value: string) {
    const current = readRaw(key);
    let next = value;
    try {
      const base = current ? (JSON.parse(current) as Record<string, unknown>) : {};
      const patch = JSON.parse(value) as Record<string, unknown>;
      next = JSON.stringify({ ...base, ...patch });
    } catch {
      next = value;
    }
    writeRaw(key, next);
  },
  async clear() {
    for (const key of [...memory.keys()]) {
      removeRaw(key);
    }
  },
  async getAllKeys() {
    const session = storage();
    if (session) {
      try {
        for (let index = 0; index < session.length; index += 1) {
          const storedKey = session.key(index);
          if (storedKey?.startsWith(PREFIX)) {
            const key = storedKey.slice(PREFIX.length);
            const value = session.getItem(storedKey);
            if (value !== null) {
              memory.set(key, value);
            }
          }
        }
      } catch {
        // Use whatever is already in memory.
      }
    }
    return [...memory.keys()];
  },
  async multiGet(keys: readonly string[]) {
    const entries: [string, string | null][] = [];
    for (const key of keys) {
      entries.push([key, readRaw(key)]);
    }
    return entries;
  },
  async multiSet(entries: readonly (readonly [string, string])[]) {
    for (const [key, value] of entries) {
      writeRaw(key, value);
    }
  },
  async multiRemove(keys: readonly string[]) {
    for (const key of keys) {
      removeRaw(key);
    }
  },
};

export default AsyncStorage;
