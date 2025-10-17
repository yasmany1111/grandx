export type Vec2 = [number, number];

export type MapMode =
	| 'political'
	| 'terrain'
	| 'supply'
	| 'development'
	| 'diplomacy';

export interface Country {
	tag: string;
	name: string;
	color: string;
	secondaryColor?: string;
	capitalProvinceId: string;
}

export interface Province {
	id: string;
	name: string;
	centroid: Vec2;
	neighbors: string[];
	ownerTag: string;
	controllerTag: string;
	terrain: 'plains' | 'forest' | 'mountain' | 'desert' | 'coast';
	development: number;
	supplyLimit: number;
	population: number;
}

export interface Region {
	id: string;
	name: string;
	provinceIds: string[];
}

export interface MapModeDefinition {
	id: MapMode;
	label: string;
	description: string;
	icon: string;
}

export interface MapOverlayMetric {
	provinceId: string;
	value: number;
}

export interface MapConceptData {
	countries: Country[];
	provinces: Province[];
	regions: Region[];
}

export interface ProvinceSummaryViewModel {
	province: Province;
	owner: Country | undefined;
	controller: Country | undefined;
	region: Region | undefined;
	developmentTier: 'nascent' | 'growing' | 'established' | 'metropolis';
}

export interface MapInteractionState {
	selectedProvinceId: string | null;
	hoveredProvinceId: string | null;
	mapMode: MapMode;
}

