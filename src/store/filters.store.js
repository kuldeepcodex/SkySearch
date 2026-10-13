import { create } from "zustand";

const DEFAULT_SORT = "best";

export const useFiltersStore = create((set) => ({
  priceRange: [0, 1000000],
  selectedStops: [],
  selectedAirlines: [],
  sortPreset: DEFAULT_SORT,

  setPriceRange: (priceRange) => set({ priceRange }),
  toggleStop: (stop) =>
    set((state) => ({
      selectedStops: state.selectedStops.includes(stop)
        ? state.selectedStops.filter((s) => s !== stop)
        : [...state.selectedStops, stop],
    })),
  toggleAirline: (code) =>
    set((state) => ({
      selectedAirlines: state.selectedAirlines.includes(code)
        ? state.selectedAirlines.filter((c) => c !== code)
        : [...state.selectedAirlines, code],
    })),
  setSortPreset: (sortPreset) => set({ sortPreset }),
  resetFilters: (defaultPriceRange = [0, 1000000]) =>
    set({
      priceRange: defaultPriceRange,
      selectedStops: [],
      selectedAirlines: [],
      sortPreset: DEFAULT_SORT,
    }),
}));
