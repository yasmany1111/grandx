import type { Feature, FeatureCollection, Geometry } from 'geojson';
import franceGeoJson from 'world-geojson/countries/france.json';
import spainGeoJson from 'world-geojson/countries/spain.json';
import germanyGeoJson from 'world-geojson/countries/germany.json';
import italyGeoJson from 'world-geojson/countries/italy.json';
import unitedKingdomGeoJson from 'world-geojson/countries/united_kingdom.json';
import norwayGeoJson from 'world-geojson/countries/norway.json';
import swedenGeoJson from 'world-geojson/countries/sweden.json';
import denmarkGeoJson from 'world-geojson/countries/denmark.json';
import portugalGeoJson from 'world-geojson/countries/portugal.json';
import belgiumGeoJson from 'world-geojson/countries/belgium.json';
import netherlandsGeoJson from 'world-geojson/countries/netherlands.json';

import type {
	Country,
	MapConceptData,
	MapMode,
	MapModeDefinition,
	MapOverlayMetric,
	Province,
	Region,
} from '../types';
import { getFeatureCentroid } from '../lib/geojson-centroid';

const SOURCE_COLLECTIONS: FeatureCollection<Geometry>[] = [
	franceGeoJson as FeatureCollection<Geometry>,
	spainGeoJson as FeatureCollection<Geometry>,
	germanyGeoJson as FeatureCollection<Geometry>,
	italyGeoJson as FeatureCollection<Geometry>,
	unitedKingdomGeoJson as FeatureCollection<Geometry>,
	norwayGeoJson as FeatureCollection<Geometry>,
	swedenGeoJson as FeatureCollection<Geometry>,
	denmarkGeoJson as FeatureCollection<Geometry>,
	portugalGeoJson as FeatureCollection<Geometry>,
	belgiumGeoJson as FeatureCollection<Geometry>,
	netherlandsGeoJson as FeatureCollection<Geometry>,
];

const GEOJSON: FeatureCollection<Geometry> = {
	 type: 'FeatureCollection',
	 features: SOURCE_COLLECTIONS.flatMap((collection) => collection.features ?? []),
};

const safeProperty = <T extends Feature>(feature: T, keys: string[], fallback = ''): string => {
	const properties = feature.properties as Record<string, unknown> | undefined;
	if (!properties) {
		return fallback;
	}
	for (const key of keys) {
		const raw = properties[key];
		if (typeof raw === 'string' && raw.trim().length > 0) {
			return raw;
		}
	}
	return fallback;
};

const slugify = (value: string): string => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'unknown';

const extractPolygon = (feature: Feature): Array<[number, number]> | null => {
	const geometry = feature.geometry;
	if (!geometry) {
		return null;
	}
	if (geometry.type === 'Polygon') {
		const [ring] = geometry.coordinates;
		return ring ? ring.map(([lng, lat]) => [lng, lat]) : null;
	}
	if (geometry.type === 'MultiPolygon') {
		const [firstPolygon] = geometry.coordinates;
		if (!firstPolygon) {
			return null;
		}
		const [ring] = firstPolygon;
		return ring ? ring.map(([lng, lat]) => [lng, lat]) : null;
	}
	return null;
};

const deriveTerrain = (lat: number): Province['terrain'] => {
	if (lat > 60) {
		return 'forest';
	}
	if (lat > 50) {
		return 'plains';
	}
	if (lat > 45) {
		return 'forest';
	}
	if (lat > 35) {
		return 'plains';
	}
	if (lat > 25) {
		return 'coast';
	}
	return 'desert';
};

const hashString = (input: string): number => {
	let hash = 0;
	for (let i = 0; i < input.length; i += 1) {
		hash = (hash << 5) - hash + input.charCodeAt(i);
		hash |= 0;
	}
	return Math.abs(hash);
};

const provinceRegionLookup = new Map<string, string>();

const buildProvinces = (): Province[] => {
	const features = GEOJSON.features ?? [];
	return features
		.map((feature, index) => {
			const name = safeProperty(feature, ['name', 'NAME', 'admin', 'ADMIN'], `Territory ${index + 1}`);
			const slug = slugify(name);
			const polygon = extractPolygon(feature);
			if (!polygon) {
				return null;
			}
			const [lng, lat] = getFeatureCentroid(feature);
			const terrain = deriveTerrain(lat);
			const devBase = hashString(name) % 60;
			const regionName = safeProperty(feature, ['subregion', 'SUBREGION', 'region', 'REGION', 'continent', 'CONTINENT'], 'European Theatre');
			const provinceId = `prov-${slug}`;
			provinceRegionLookup.set(provinceId, regionName);
			return {
				id: provinceId,
				name,
				centroid: [lng, lat],
				polygon,
				neighbors: [],
				ownerTag: `country-${slug}`,
				controllerTag: `country-${slug}`,
				terrain,
				development: 40 + (devBase % 50),
				supplyLimit: 12 + (devBase % 18),
				population: 300000 + (hashString(`${name}-pop`) % 3000000),
			};
		})
		.filter((province): province is Province => province !== null);
};

const buildCountries = (provinces: Province[]): Country[] => {
	const countriesByTag = new Map<string, Country>();
	for (const province of provinces) {
		if (countriesByTag.has(province.ownerTag)) {
			continue;
		}
		const name = province.name;
		countriesByTag.set(province.ownerTag, {
			tag: province.ownerTag,
			name,
			color: `hsl(${hashString(name) % 360}deg 70% 60%)`,
			capitalProvinceId: province.id,
		});
	}
	return Array.from(countriesByTag.values());
};

const buildRegions = (provinces: Province[]): Region[] => {
	const regionsByName = new Map<string, Region>();
	for (const province of provinces) {
		const regionName = provinceRegionLookup.get(province.id) ?? 'European Theatre';
		const regionId = slugify(regionName);
		const region = regionsByName.get(regionId);
		if (region) {
			region.provinceIds.push(province.id);
		} else {
			regionsByName.set(regionId, {
				id: regionId,
				name: regionName,
				provinceIds: [province.id],
			});
		}
	}
	return Array.from(regionsByName.values());
};

const provinces = buildProvinces();
const countries = buildCountries(provinces);
const regions = buildRegions(provinces);

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

export const MOCK_DEVELOPMENT_METRIC: MapOverlayMetric[] = provinces.map((province) => ({
	provinceId: province.id,
	value: province.development,
}));

export const MOCK_SUPPLY_METRIC: MapOverlayMetric[] = provinces.map((province) => ({
	provinceId: province.id,
	value: province.supplyLimit,
}));

export const MOCK_RELATIONS: Record<string, number> = countries.reduce<Record<string, number>>((acc, country, index) => {
	acc[country.tag] = -40 + (index % 5) * 20;
	return acc;
}, {});

export const MOCK_MAP_DATA: MapConceptData = {
	countries,
	provinces,
	regions,
};

export const DEFAULT_MAP_MODE: MapMode = 'political';
