import { create } from 'zustand';

import { DEFAULT_MAP_MODE } from '../data/mock-world';
import type { MapInteractionState, MapMode } from '../types';

interface MapInteractionStore extends MapInteractionState {
	setHoveredProvince: (provinceId: string | null) => void;
	setSelectedProvince: (provinceId: string | null) => void;
	setMapMode: (mode: MapMode) => void;
}

export const useMapInteraction = create<MapInteractionStore>((set) => ({
	selectedProvinceId: null,
	hoveredProvinceId: null,
	mapMode: DEFAULT_MAP_MODE,
	setHoveredProvince: (provinceId) => set({ hoveredProvinceId: provinceId }),
	setSelectedProvince: (provinceId) => set({ selectedProvinceId: provinceId }),
	setMapMode: (mode) => set({ mapMode: mode }),
}));

