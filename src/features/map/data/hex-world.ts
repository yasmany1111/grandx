import { generateHexMap } from '../lib/terrain-generation';
import type { Country, HexMapData, MapMode, MapModeDefinition } from '../types';

// Map configuration
const MAP_WIDTH = 60;
const MAP_HEIGHT = 40;
const MAP_SEED = 12345; // Fixed seed for consistent map generation

// Generate the hex map
const tiles = generateHexMap({
	width: MAP_WIDTH,
	height: MAP_HEIGHT,
	seed: MAP_SEED,
	oceanLevel: 0.35,
	mountainLevel: 0.75,
});

// For now, create a simple neutral "country"
const countries: Country[] = [
	{
		tag: 'neutral',
		name: 'Neutral Territory',
		color: 'hsl(220deg 70% 60%)',
		capitalProvinceId: '', // Will be set later
	},
];

export const HEX_MAP_DATA: HexMapData = {
	tiles,
	countries,
	width: MAP_WIDTH,
	height: MAP_HEIGHT,
};

export const MAP_MODES: MapModeDefinition[] = [
	{
		id: 'political',
		label: 'Political',
		description: 'Country borders, ownership, and control.',
		icon: 'layers',
	},
	{
		id: 'terrain',
		label: 'Terrain',
		description: 'Terrain categories and travel difficulty.',
		icon: 'mountain',
	},
	{
		id: 'supply',
		label: 'Supply',
		description: 'Supply limits and logistics capacity.',
		icon: 'warehouse',
	},
	{
		id: 'development',
		label: 'Development',
		description: 'Economic output and investment tiers.',
		icon: 'trending-up',
	},
	{
		id: 'diplomacy',
		label: 'Diplomacy',
		description: 'Relations, opinions, and claims.',
		icon: 'handshake',
	},
];

export const DEFAULT_MAP_MODE: MapMode = 'political';

// Helper functions
export const getTileById = (id: string) => tiles.get(id);

export const getCountryByTag = (tag: string) =>
	countries.find((c) => c.tag === tag);
