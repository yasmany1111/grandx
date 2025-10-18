import type { Country, HexTile, MapMode, TerrainType } from '../types';

/**
 * Get fill color for a hex tile based on map mode
 */
export const getTileFill = (
	tile: HexTile,
	mapMode: MapMode,
	owner?: Country,
): string => {
	switch (mapMode) {
		case 'political':
			return getPoliticalColor(tile, owner);
		case 'terrain':
			return getTerrainColor(tile.terrain);
		case 'supply':
			return getSupplyColor(tile.supplyLimit);
		case 'development':
			return getDevelopmentColor(tile.development);
		case 'diplomacy':
			return getDiplomacyColor(tile, owner);
	}
};

/**
 * Political map mode: show owner color
 */
const getPoliticalColor = (tile: HexTile, owner?: Country): string => {
	if (tile.terrain === 'ocean') {
		return '#0f172a'; // dark ocean
	}
	if (!owner) {
		return '#475569'; // neutral gray
	}
	return owner.color;
};

/**
 * Terrain map mode: show terrain type
 */
const getTerrainColor = (terrain: TerrainType): string => {
	switch (terrain) {
		case 'ocean':
			return '#0c4a6e'; // blue-900
		case 'coast':
			return '#fef3c7'; // amber-100
		case 'plains':
			return '#86efac'; // green-300
		case 'forest':
			return '#166534'; // green-800
		case 'mountain':
			return '#78716c'; // stone-500
		case 'desert':
			return '#fbbf24'; // amber-400
	}
};

/**
 * Supply map mode: gradient based on supply limit
 */
const getSupplyColor = (supplyLimit: number): string => {
	if (supplyLimit === 0) {
		return '#0f172a'; // ocean
	}
	// Gradient from red (low) to green (high)
	const normalizedValue = Math.min(supplyLimit / 30, 1);
	const hue = normalizedValue * 120; // 0 (red) to 120 (green)
	return `hsl(${hue}deg 70% 50%)`;
};

/**
 * Development map mode: gradient based on development
 */
const getDevelopmentColor = (development: number): string => {
	if (development === 0) {
		return '#0f172a'; // ocean
	}
	// Gradient from yellow (low) to purple (high)
	const normalizedValue = Math.min(development / 100, 1);
	const hue = 45 + normalizedValue * 225; // 45 (yellow) to 270 (purple)
	return `hsl(${hue}deg 70% 50%)`;
};

/**
 * Diplomacy map mode: show relations (placeholder for now)
 */
const getDiplomacyColor = (tile: HexTile, owner?: Country): string => {
	if (tile.terrain === 'ocean') {
		return '#0f172a';
	}
	// For now, just use political colors
	// Later this can show relations, alliances, etc.
	return getPoliticalColor(tile, owner);
};

/**
 * Get border color based on map mode
 */
export const getBorderColorForMode = (mapMode: MapMode): string => {
	switch (mapMode) {
		case 'political':
			return '#1e293b'; // slate-800
		case 'terrain':
			return '#334155'; // slate-700
		case 'supply':
			return '#0f766e'; // teal-700
		case 'development':
			return '#7c3aed'; // purple-600
		case 'diplomacy':
			return '#dc2626'; // red-600
	}
};
