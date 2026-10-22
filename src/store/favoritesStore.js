import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      ids: [],
      isFavorite: (id) => get().ids.includes(id),
      // Replaces the whole list, which is what the account sync needs: it hands
      // over the merged ids once and the store then matches the account.
      setIds: (ids) =>
        set({ ids: Array.from(new Set(ids.filter(Boolean))) }),
      toggleFavorite: (id) =>
        set((state) => {
          const exists = state.ids.includes(id);
          return {
            ids: exists ? state.ids.filter((x) => x !== id) : [...state.ids, id],
          };
        }),
      clearFavorites: () => set({ ids: [] }),
    }),
    {
      name: "biniso:favorites",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

