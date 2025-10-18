import { create } from 'zustand';

import { DEFAULT_MAP_MODE } from '../data/hex-world';
import type { HexMapInteractionState, MapMode } from '../types';

interface HexMapInteractionStore extends HexMapInteractionState {
	setHoveredTile: (tileId: string | null) => void;
	setSelectedTile: (tileId: string | null) => void;
	setMapMode: (mode: MapMode) => void;
}

export const useHexMapInteraction = create<HexMapInteractionStore>((set) => ({
	selectedTileId: null,
	hoveredTileId: null,
	mapMode: DEFAULT_MAP_MODE,
	setHoveredTile: (tileId) => set({ hoveredTileId: tileId }),
	setSelectedTile: (tileId) => set({ selectedTileId: tileId }),
	setMapMode: (mode) => set({ mapMode: mode }),
}));
