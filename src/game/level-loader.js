/** Load a level from a pack without giving content access to engine modules. */
export async function loadLevel(packs, id) {
  const entry = packs.flatMap((pack) => pack.levels).find((level) => level.id === id);
  if (!entry) throw new Error(`Unknown mission: ${id}`);
  const { default: level } = await entry.load();
  if (level.id !== id || !level.buffers?.length || !level.objectives?.length)
    throw new Error(`Invalid mission: ${id}`);
  return level;
}
