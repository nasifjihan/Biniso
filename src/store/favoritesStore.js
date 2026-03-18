import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const useFavoritesStore = create(
  persist(
    (set, get) => ({
      ids: [],
      isFavorite: (id) => get().ids.includes(id),
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

