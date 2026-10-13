// Remembers the list's scroll offset per filter set, so "Back" from an event returns to the same spot.
const positions = new Map<string, number>();

export const saveScroll = (key: string, top: number) => positions.set(key, top);
export const readScroll = (key: string) => positions.get(key) ?? 0;
export const clearScroll = () => positions.clear();
