import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { getFeatureCentroid } from '../lib/geojson-centroid';
import type {
	Country,
	MapConceptData,
	MapMode,
	MapModeDefinition,
	MapOverlayMetric,
	Province,
	Region,
} from '../types';

const countryModules = import.meta.glob<FeatureCollection<Geometry>>(
	'../../../../node_modules/world-geojson/countries/*.json',
	{
		eager: true,
		import: 'default',
	},
);

const stateModules = import.meta.glob<FeatureCollection<Geometry>>(
	'../../../../node_modules/world-geojson/states/**/*.json',
	{
		eager: true,
		import: 'default',
	},
);

const areaModules = import.meta.glob<FeatureCollection<Geometry>>(
	'../../../../node_modules/world-geojson/areas/**/*.json',
	{
		eager: true,
		import: 'default',
	},
);

const toFeatures = (
	collections: Record<string, FeatureCollection<Geometry>>,
): Feature[] =>
	Object.values(collections).flatMap((collection) => collection.features ?? []);

const GEOJSON: FeatureCollection<Geometry> = {
	type: 'FeatureCollection',
	features: toFeatures(countryModules),
};

const safeProperty = <T extends Feature>(
	feature: T,
	keys: string[],
	fallback = '',
): string => {
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

const slugify = (value: string): string =>
	value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '') || 'unknown';

const formatDatasetName = (value: string): string =>
	value
		.toLowerCase()
		.replace(/ /g, '_')
		.replace(/\./g, '')
		.replace(/&/g, 'and');

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

const countryLabelByTag = new Map<string, string>();
const countryDatasetKeyByTag = new Map<string, string>();
const countryTagByDatasetKey = new Map<string, string>();
const provinceLookup = new Map<string, Province>();
const provinceRegionNameLookup = new Map<string, string>();
const provinceRegionIdLookup = new Map<string, string>();
const regionsById = new Map<string, Region>();
const subdivisionsByCountryTag = new Map<string, Province[]>();

const registerProvinceRegion = (provinceId: string, regionName: string) => {
	const safeName =
		regionName && regionName.trim().length > 0
			? regionName
			: 'Unassigned Region';
	const regionId = `region-${slugify(safeName) || 'unassigned'}`;
	provinceRegionNameLookup.set(provinceId, safeName);
	provinceRegionIdLookup.set(provinceId, regionId);
	const existing = regionsById.get(regionId);
	if (existing) {
		existing.provinceIds.push(provinceId);
	} else {
		regionsById.set(regionId, {
			id: regionId,
			name: safeName,
			provinceIds: [provinceId],
		});
	}
};

const registerProvince = (province: Province, regionName: string) => {
	provinceLookup.set(province.id, province);
	registerProvinceRegion(province.id, regionName);
};

const buildBaseProvinces = (): Province[] => {
	const features = GEOJSON.features ?? [];
	return features
		.map((feature, index) => {
			const name = safeProperty(
				feature,
				['name', 'NAME'],
				`Territory ${index + 1}`,
			);
			const ownerName = safeProperty(
				feature,
				['admin', 'ADMIN', 'sovereignt', 'SOVEREIGNT', 'name', 'NAME'],
				name,
			);
			const datasetKey = formatDatasetName(ownerName);
			const ownerTag = `country-${datasetKey}`;
			const polygon = extractPolygon(feature);
			if (!polygon) {
				return null;
			}
			const [lng, lat] = getFeatureCentroid(feature);
			const terrain = deriveTerrain(lat);
			const devBase = hashString(name) % 60;
			const regionName = safeProperty(
				feature,
				[
					'subregion',
					'SUBREGION',
					'region',
					'REGION',
					'continent',
					'CONTINENT',
				],
				ownerName,
			);
			const provinceId = `prov-${datasetKey}-${slugify(name)}`;
			const province: Province = {
				id: provinceId,
				name,
				centroid: [lng, lat],
				polygon,
				neighbors: [],
				ownerTag,
				controllerTag: ownerTag,
				terrain,
				development: 40 + (devBase % 50),
				supplyLimit: 12 + (devBase % 18),
				population: 300000 + (hashString(`${name}-pop`) % 3000000),
			};
			countryLabelByTag.set(ownerTag, ownerName);
			countryDatasetKeyByTag.set(ownerTag, datasetKey);
			countryTagByDatasetKey.set(datasetKey, ownerTag);
			registerProvince(province, regionName);
			return province;
		})
		.filter((province): province is Province => province !== null);
};

const buildCountries = (provinces: Province[]): Country[] => {
	const countriesByTag = new Map<string, Country>();
	for (const province of provinces) {
		if (countriesByTag.has(province.ownerTag)) {
			continue;
		}
		const ownerName = countryLabelByTag.get(province.ownerTag) ?? province.name;
		countriesByTag.set(province.ownerTag, {
			tag: province.ownerTag,
			name: ownerName,
			color: `hsl(${hashString(ownerName) % 360}deg 70% 60%)`,
			capitalProvinceId: province.id,
		});
	}
	return Array.from(countriesByTag.values());
};

const ensureSubdivisionBucket = (ownerTag: string): Province[] => {
	const existing = subdivisionsByCountryTag.get(ownerTag);
	if (existing) {
		return existing;
	}
	const bucket: Province[] = [];
	subdivisionsByCountryTag.set(ownerTag, bucket);
	return bucket;
};

const registerSubdivisionCollections = (
	modules: Record<string, FeatureCollection<Geometry>>,
	options: { typeLabel: string },
) => {
	for (const [path, collection] of Object.entries(modules)) {
		const match = path.match(/\/(states|areas)\/([^/]+)\//);
		if (!match) {
			continue;
		}
		const datasetKey = match[2];
		const ownerTag = countryTagByDatasetKey.get(datasetKey);
		if (!ownerTag) {
			continue;
		}
		const ownerName = countryLabelByTag.get(ownerTag) ?? datasetKey;
		const bucket = ensureSubdivisionBucket(ownerTag);
		for (const feature of collection.features ?? []) {
			const name = safeProperty(
				feature,
				['name', 'NAME'],
				`${ownerName} ${options.typeLabel}`,
			);
			const polygon = extractPolygon(feature);
			if (!polygon) {
				continue;
			}
			const [lng, lat] = getFeatureCentroid(feature);
			const terrain = deriveTerrain(lat);
			const devBase = hashString(`${ownerTag}-${name}`) % 60;
			const regionName = safeProperty(
				feature,
				['region', 'REGION', 'subregion', 'SUBREGION'],
				`${ownerName} ${options.typeLabel}`,
			);
			const provinceId = `prov-${datasetKey}-${options.typeLabel}-${slugify(name)}`;
			const province: Province = {
				id: provinceId,
				name,
				centroid: [lng, lat],
				polygon,
				neighbors: [],
				ownerTag,
				controllerTag: ownerTag,
				terrain,
				development: 35 + (devBase % 40),
				supplyLimit: 10 + (devBase % 15),
				population: 150000 + (hashString(`${name}-pop`) % 2000000),
			};
			bucket.push(province);
			registerProvince(province, regionName);
		}
	}
};

const baseProvinces = buildBaseProvinces();

registerSubdivisionCollections(stateModules, { typeLabel: 'state' });
registerSubdivisionCollections(areaModules, { typeLabel: 'area' });

const provinces = baseProvinces;
const countries = buildCountries(baseProvinces);
const regions = Array.from(regionsById.values());

const countryLookupByTag = new Map<string, Country>();
for (const country of countries) {
	countryLookupByTag.set(country.tag, country);
}

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

export const MOCK_DEVELOPMENT_METRIC: MapOverlayMetric[] = provinces.map(
	(province) => ({
		provinceId: province.id,
		value: province.development,
	}),
);

export const MOCK_SUPPLY_METRIC: MapOverlayMetric[] = provinces.map(
	(province) => ({
		provinceId: province.id,
		value: province.supplyLimit,
	}),
);

export const MOCK_RELATIONS: Record<string, number> = countries.reduce<
	Record<string, number>
>((acc, country, index) => {
	acc[country.tag] = -40 + (index % 5) * 20;
	return acc;
}, {});

export const MOCK_MAP_DATA: MapConceptData = {
	countries,
	provinces,
	regions,
};

export const DEFAULT_MAP_MODE: MapMode = 'political';

export const getCountrySubdivisions = (ownerTag: string): Province[] | null => {
	const list = subdivisionsByCountryTag.get(ownerTag);
	return list ? [...list] : null;
};

export const findProvinceById = (provinceId: string): Province | undefined =>
	provinceLookup.get(provinceId);

export const findCountryByTag = (tag: string): Country | undefined =>
	countryLookupByTag.get(tag);

export const findRegionByProvinceId = (
	provinceId: string,
): Region | undefined => {
	const regionId = provinceRegionIdLookup.get(provinceId);
	if (!regionId) {
		return undefined;
	}
	const region = regionsById.get(regionId);
	if (!region) {
		return undefined;
	}
	return { ...region, provinceIds: [...region.provinceIds] };
};
