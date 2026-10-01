/** Create the application's state owner; all mutations publish through update(). */
export function createStore(initialState) {
  let state = initialState;
  const subscribers = new Set();
  return {
    getState: () => state,
    update(change) {
      const next = change(state);
      if (next === state) return;
      state = next;
      for (const subscriber of subscribers) subscriber(state);
    },
    subscribe(subscriber) {
      subscribers.add(subscriber);
      return () => subscribers.delete(subscriber);
    },
  };
}
