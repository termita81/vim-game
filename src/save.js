export const SAVE_KEY = 'ghostprotocol.v1';
export const SAVE_VERSION = 1;
// Add a function keyed by the OLD schema version for each future migration.
export const migrations = {};
const choices = {
  theme: ['green', 'amber', 'grey'],
  fontSize: ['S', 'M', 'L'],
  escAlias: ['none', 'jk'],
  windowPrefix: ['auto', 'native', 'leader'],
};

/** Return a fresh save; no mutable defaults are shared between sessions. */
export function defaultSave() {
  return {
    version: SAVE_VERSION,
    settings: {
      theme: 'green',
      fontSize: 'M',
      keyOverlay: true,
      relativeNumber: false,
      escAlias: 'none',
      windowPrefix: 'auto',
    },
    progress: {},
    toolkit: {},
    insultHistory: [],
    seen: {},
  };
}
/** Clear journey history while retaining an independent copy of player preferences. */
export function resetJourney(storage, currentSave) {
  const data = { ...defaultSave(), settings: { ...currentSave.settings } };
  return { data, persisted: writeSave(storage, data) };
}

const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const nonnegative = (value) => Number.isFinite(value) && value >= 0;

/** Validate persisted data before using it; invalid data must never reset silently. */
export function validateSave(data) {
  if (!record(data) || data.version !== SAVE_VERSION || !record(data.settings)) return false;
  if (Object.entries(choices).some(([key, values]) => !values.includes(data.settings[key])))
    return false;
  if (
    typeof data.settings.keyOverlay !== 'boolean' ||
    typeof data.settings.relativeNumber !== 'boolean'
  )
    return false;
  if (!record(data.progress) || !record(data.toolkit) || !record(data.seen)) return false;
  if (
    !Array.isArray(data.insultHistory) ||
    !data.insultHistory.every((item) => typeof item === 'string')
  )
    return false;
  if (!Object.values(data.seen).every((value) => typeof value === 'boolean')) return false;
  if (
    !Object.values(data.toolkit).every(
      (value) => record(value) && Number.isInteger(value.uses) && value.uses >= 0,
    )
  )
    return false;
  return Object.values(data.progress).every(
    (entry) =>
      record(entry) &&
      Number.isInteger(entry.attempts) &&
      entry.attempts >= 0 &&
      typeof entry.completed === 'boolean' &&
      (entry.bestRank === null ||
        (Number.isInteger(entry.bestRank) && entry.bestRank >= 0 && entry.bestRank <= 4)) &&
      (entry.bestPoints === null || nonnegative(entry.bestPoints)),
  );
}

/** Read and migrate a save without changing storage; the UI owns reset confirmation. */
export function readSave(storage) {
  let raw;
  try {
    raw = storage.getItem(SAVE_KEY);
  } catch {
    return { status: 'unavailable', data: defaultSave() };
  }
  if (raw === null) return { status: 'ready', data: defaultSave() };
  try {
    let data = JSON.parse(raw);
    while (
      Number.isInteger(data?.version) &&
      data.version < SAVE_VERSION &&
      migrations[data.version]
    ) {
      const previous = data.version;
      data = migrations[previous](data);
      if (data?.version !== previous + 1) throw new Error('Migration must advance one version');
    }
    if (!validateSave(data)) throw new Error('Invalid or unsupported save');
    return { status: 'ready', data };
  } catch {
    return { status: 'reset-required', data: defaultSave() };
  }
}

/** Persist a validated save; report failure without discarding the in-memory session. */
export function writeSave(storage, data) {
  if (!validateSave(data)) return false;
  try {
    storage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
