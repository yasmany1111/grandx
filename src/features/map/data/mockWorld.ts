import type {
	Country,
	MapConceptData,
	MapModeDefinition,
	MapOverlayMetric,
	MapMode,
	Province,
	Region,
} from '../types';

const COUNTRIES: Country[] = [
	{
		tag: 'ALB',
		name: 'Alberian Union',
		color: '#6cb8ff',
		secondaryColor: '#19427d',
		capitalProvinceId: 'p-albion',
	},
	{
		tag: 'VAR',
		name: 'Varenth Dominion',
		color: '#ff7b47',
		secondaryColor: '#6b1f0f',
		capitalProvinceId: 'p-varos',
	},
	{
		tag: 'KRS',
		name: 'Karsan Steppes',
		color: '#9bd26c',
		secondaryColor: '#395b1c',
		capitalProvinceId: 'p-steppe-cap',
	},
];

const PROVINCES: Province[] = [
	{
		id: 'p-albion',
		name: 'Albion',
		centroid: [0.1, 0.54],
		neighbors: ['p-graycliff', 'p-lakeshire'],
		ownerTag: 'ALB',
		controllerTag: 'ALB',
		terrain: 'plains',
		development: 68,
		supplyLimit: 24,
		population: 920000,
	},
	{
		id: 'p-graycliff',
		name: 'Graycliff',
		centroid: [0.2, 0.72],
		neighbors: ['p-albion', 'p-northwatch'],
		ownerTag: 'ALB',
		controllerTag: 'ALB',
		terrain: 'coast',
		development: 52,
		supplyLimit: 18,
		population: 410000,
	},
	{
		id: 'p-lakeshire',
		name: 'Lakeshire',
		centroid: [0.28, 0.46],
		neighbors: ['p-albion', 'p-varos'],
		ownerTag: 'ALB',
		controllerTag: 'ALB',
		terrain: 'forest',
		development: 45,
		supplyLimit: 16,
		population: 330000,
	},
	{
		id: 'p-varos',
		name: 'Varos',
		centroid: [0.45, 0.42],
		neighbors: ['p-lakeshire', 'p-emberfall'],
		ownerTag: 'VAR',
		controllerTag: 'VAR',
		terrain: 'mountain',
		development: 38,
		supplyLimit: 12,
		population: 280000,
	},
	{
		id: 'p-emberfall',
		name: 'Emberfall',
		centroid: [0.58, 0.36],
		neighbors: ['p-varos', 'p-sunreach'],
		ownerTag: 'VAR',
		controllerTag: 'VAR',
		terrain: 'desert',
		development: 22,
		supplyLimit: 8,
		population: 140000,
	},
	{
		id: 'p-sunreach',
		name: 'Sunreach',
		centroid: [0.68, 0.28],
		neighbors: ['p-emberfall', 'p-steppe-cap'],
		ownerTag: 'VAR',
		controllerTag: 'VAR',
		terrain: 'desert',
		development: 26,
		supplyLimit: 9,
		population: 160000,
	},
	{
		id: 'p-steppe-cap',
		name: 'Saryk Vale',
		centroid: [0.78, 0.32],
		neighbors: ['p-sunreach', 'p-nomad-frontier'],
		ownerTag: 'KRS',
		controllerTag: 'KRS',
		terrain: 'plains',
		development: 30,
		supplyLimit: 14,
		population: 220000,
	},
	{
		id: 'p-nomad-frontier',
		name: 'Nomad Frontier',
		centroid: [0.86, 0.38],
		neighbors: ['p-steppe-cap'],
		ownerTag: 'KRS',
		controllerTag: 'KRS',
		terrain: 'plains',
		development: 14,
		supplyLimit: 6,
		population: 90000,
	},
];

const REGIONS: Region[] = [
	{
		id: 'r-heartlands',
		name: 'Central Heartlands',
		provinceIds: ['p-albion', 'p-graycliff', 'p-lakeshire'],
	},
	{
		id: 'r-ember-spine',
		name: 'Ember Spine',
		provinceIds: ['p-varos', 'p-emberfall', 'p-sunreach'],
	},
	{
		id: 'r-steppe',
		name: 'Karsan Steppe',
		provinceIds: ['p-steppe-cap', 'p-nomad-frontier'],
	},
];

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

export const MOCK_DEVELOPMENT_METRIC: MapOverlayMetric[] = PROVINCES.map(
	(province) => ({
		provinceId: province.id,
		value: province.development,
	}),
);

export const MOCK_SUPPLY_METRIC: MapOverlayMetric[] = PROVINCES.map(
	(province) => ({
		provinceId: province.id,
		value: province.supplyLimit,
	}),
);

export const MOCK_RELATIONS: Record<string, number> = {
	ALB: 35,
	VAR: -45,
	KRS: 10,
};

export const MOCK_MAP_DATA: MapConceptData = {
	countries: COUNTRIES,
	provinces: PROVINCES,
	regions: REGIONS,
};

export const DEFAULT_MAP_MODE: MapMode = 'political';

