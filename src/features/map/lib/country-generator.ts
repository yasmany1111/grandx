import type { TerrainType } from '../types';
import { generateHexGridCircle } from './hex-layout';

// Name pools for generating random country names
const NAME_PREFIXES = [
	'Nor',
	'Ald',
	'Val',
	'Kor',
	'Bel',
	'Mor',
	'Thal',
	'Dor',
	'Kal',
	'Ven',
	'Ash',
	'Lor',
	'Var',
	'Zar',
	'Fel',
	'Gal',
	'Hal',
	'Jor',
	'Kyr',
	'Mel',
	'Nex',
	'Pol',
	'Ras',
	'Sil',
	'Tel',
	'Uth',
	'Wyr',
	'Xan',
	'Yor',
	'Zul',
];

const NAME_SUFFIXES = [
	'aria',
	'heim',
	'land',
	'onia',
	'ovia',
	'mark',
	'stan',
	'dor',
	'varia',
	'tania',
	'donia',
	'burg',
	'moor',
	'vale',
	'reach',
	'garde',
	'ros',
	'thia',
	'wyn',
	'ara',
];

const PROVINCE_PREFIXES = [
	'Ar',
	'Bel',
	'Cal',
	'Dra',
	'Eld',
	'Fal',
	'Gar',
	'Hal',
	'Isl',
	'Jun',
	'Kar',
	'Lun',
	'Mar',
	'Nim',
	'Orn',
	'Pra',
	'Quel',
	'Riv',
	'Syl',
	'Thal',
	'Ulm',
	'Vor',
	'Wind',
	'Xer',
	'Yar',
	'Zel',
];

const PROVINCE_SUFFIXES = [
	'ford',
	'stead',
	'brook',
	'cliff',
	'grove',
	'haven',
	'meadow',
	'mount',
	'pass',
	'point',
	'reach',
	'ridge',
	'shore',
	'spire',
	'vale',
	'view',
	'watch',
	'well',
	'wick',
	'wynd',
];

export interface GeneratedCountry {
	id: string;
	name: string;
	color: string;
	hexIds: string[];
	territories: GeneratedProvince[];
	capital: string;
	capitalProvinceId: string;
	population: number;
	gdp: number;
	supplyCapacity: number;
	averageDevelopment: number;
	government: string;
	seedPoint: { lat: number; lng: number };
	terrainBreakdown: Record<TerrainType, number>;
}

export interface GeneratedProvince {
	id: string;
	hexId: string;
	name: string;
	coord: { q: number; r: number };
	terrain: TerrainType;
	elevation: number;
	population: number;
	development: number;
	supplyLimit: number;
	gdp: number;
}

const TERRAIN_TYPES: TerrainType[] = [
	'ocean',
	'coast',
	'plains',
	'forest',
	'mountain',
	'desert',
];

const GDP_PER_CAPITA: Record<TerrainType, number> = {
	ocean: 0,
	coast: 11500,
	plains: 9500,
	forest: 7800,
	mountain: 6500,
	desert: 4200,
};

const clamp = (value: number, min: number, max: number): number =>
	Math.max(min, Math.min(max, value));

const classifyTerrain = (
	elevation: number,
	moisture: number,
	temperature: number,
): TerrainType => {
	if (elevation < 0.35) {
		return 'ocean';
	}

	if (elevation < 0.42) {
		return 'coast';
	}

	if (elevation > 0.75) {
		return 'mountain';
	}

	if (moisture < 0.3 && temperature > 0.6) {
		return 'desert';
	}

	if (moisture > 0.55) {
		return 'forest';
	}

	return 'plains';
};

const deriveTerrainStats = (
	terrain: TerrainType,
	elevation: number,
): {
	development: number;
	supplyLimit: number;
	population: number;
} => {
	switch (terrain) {
		case 'ocean':
			return { development: 0, supplyLimit: 0, population: 0 };
		case 'coast':
			return {
				development: 45 + Math.floor(elevation * 20),
				supplyLimit: 15 + Math.floor(elevation * 10),
				population: 500_000 + Math.floor(elevation * 300_000),
			};
		case 'plains':
			return {
				development: 50 + Math.floor(elevation * 30),
				supplyLimit: 20 + Math.floor(elevation * 15),
				population: 600_000 + Math.floor(elevation * 400_000),
			};
		case 'forest':
			return {
				development: 40 + Math.floor(elevation * 25),
				supplyLimit: 12 + Math.floor(elevation * 8),
				population: 300_000 + Math.floor(elevation * 200_000),
			};
		case 'mountain':
			return {
				development: 25 + Math.floor(elevation * 15),
				supplyLimit: 8 + Math.floor(elevation * 5),
				population: 100_000 + Math.floor(elevation * 150_000),
			};
		case 'desert':
			return {
				development: 20 + Math.floor(elevation * 10),
				supplyLimit: 6 + Math.floor(elevation * 4),
				population: 50_000 + Math.floor(elevation * 100_000),
			};
	}
};

const createRandomGenerator = (seed: number): (() => number) => {
	let state = seed >>> 0;
	if (state === 0) {
		state = 0x6d2b79f5;
	}

	return () => {
		state += 0x6d2b79f5;
		let t = Math.imul(state ^ (state >>> 15), 1 | state);
		t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
};

const shuffleArray = <T>(items: T[], random: () => number): T[] => {
	const array = [...items];
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
};

const generateProvinceName = (random: () => number): string => {
	const prefix =
		PROVINCE_PREFIXES[Math.floor(random() * PROVINCE_PREFIXES.length)];
	const suffix =
		PROVINCE_SUFFIXES[Math.floor(random() * PROVINCE_SUFFIXES.length)];
	return `${prefix}${suffix}`;
};

// Generate a random country name
const generateCountryName = (seed: number): string => {
	const prefixIndex =
		Math.floor(seed * NAME_PREFIXES.length) % NAME_PREFIXES.length;
	const suffixIndex =
		Math.floor(seed * 7 * NAME_SUFFIXES.length) % NAME_SUFFIXES.length;
	return `${NAME_PREFIXES[prefixIndex]}${NAME_SUFFIXES[suffixIndex]}`;
};

// Generate a random color for a country
const generateCountryColor = (seed: number): string => {
	const hue = (seed * 137.508) % 360; // Golden angle for good distribution
	const saturation = 65 + ((seed * 20) % 25);
	const lightness = 60 + ((seed * 15) % 20); // Lighter colors for dark background
	return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

// Get neighboring hex coordinates
const getNeighbors = (q: number, r: number): Array<[number, number]> => {
	return [
		[q + 1, r],
		[q - 1, r],
		[q, r + 1],
		[q, r - 1],
		[q + 1, r - 1],
		[q - 1, r + 1],
	];
};

// Convert coordinate to hex ID
const coordToId = (q: number, r: number): string => `${q},${r}`;

// Flood fill algorithm to grow a country
const growCountry = (
	startCoord: [number, number],
	availableHexes: Set<string>,
	targetSize: number,
	random: () => number,
): string[] => {
	const countryHexes: string[] = [];
	const queue: Array<[number, number]> = [startCoord];
	const visited = new Set<string>();

	while (queue.length > 0 && countryHexes.length < targetSize) {
		const [q, r] = queue.shift()!;
		const hexId = coordToId(q, r);

		if (visited.has(hexId) || !availableHexes.has(hexId)) {
			continue;
		}

		visited.add(hexId);
		countryHexes.push(hexId);
		availableHexes.delete(hexId);

		// Add neighbors to queue
		const neighbors = shuffleArray(getNeighbors(q, r), random);

		for (const [nq, nr] of neighbors) {
			const neighborId = coordToId(nq, nr);
			if (!visited.has(neighborId) && availableHexes.has(neighborId)) {
				queue.push([nq, nr]);
			}
		}
	}

	return countryHexes;
};

const GOVERNMENTS = [
	'Constitutional Monarchy',
	'Republic',
	'Empire',
	'Federation',
	'Principality',
	'Kingdom',
	'Theocracy',
	'Democracy',
];

// Generate a random point on a sphere using spherical coordinates
const generateSpherePoint = (seed: number): { lat: number; lng: number } => {
	// Use uniform distribution on sphere
	const u = (seed * 1000) % 1;
	const v = (seed * 7919) % 1;

	const lat = Math.asin(2 * u - 1) * (180 / Math.PI); // -90 to 90
	const lng = v * 360 - 180; // -180 to 180

	return { lat, lng };
};

const computeProvinceStats = (
	q: number,
	r: number,
	gridRadius: number,
	random: () => number,
): {
	terrain: TerrainType;
	elevation: number;
	population: number;
	development: number;
	supplyLimit: number;
	gdp: number;
} => {
	const safeRadius = Math.max(gridRadius, 1);
	const radialDistance = Math.sqrt(q * q + r * r);
	const radialNormalized = clamp(radialDistance / safeRadius, 0, 1);
	const latNormalized = clamp((r + safeRadius) / (safeRadius * 2), 0, 1);

	const elevation = clamp(
		1 - radialNormalized * 0.85 + (random() - 0.5) * 0.25,
		0,
		1,
	);
	const moisture = clamp(
		0.4 + (1 - radialNormalized) * 0.35 + (random() - 0.5) * 0.3,
		0,
		1,
	);
	const temperature = clamp(
		1 - Math.abs(latNormalized - 0.5) * 1.7 + (random() - 0.5) * 0.25,
		0,
		1,
	);

	const terrain = classifyTerrain(elevation, moisture, temperature);
	const baseStats = deriveTerrainStats(terrain, elevation);

	const population =
		baseStats.population > 0
			? Math.round(baseStats.population * (0.9 + random() * 0.3))
			: 0;
	const development = Math.max(
		5,
		Math.round(baseStats.development * (0.88 + random() * 0.3)),
	);
	const supplyLimit =
		baseStats.supplyLimit > 0
			? Math.max(1, Math.round(baseStats.supplyLimit * (0.85 + random() * 0.25)))
			: 0;
	const gdpPerCapita = GDP_PER_CAPITA[terrain] ?? GDP_PER_CAPITA.plains;
	const gdp =
		population > 0
			? Math.round(population * (0.9 + random() * 0.25) * gdpPerCapita)
			: 0;

	return {
		terrain,
		elevation: Math.round(elevation * 100),
		population,
		development,
		supplyLimit,
		gdp,
	};
};

export const generateCountries = (
	gridRadius: number,
	numCountries: number = 15,
	seed: number = Math.random(),
): GeneratedCountry[] => {
	const baseSeed = Number.isFinite(seed) ? seed : Math.random();
	const random = createRandomGenerator(
		Math.floor(baseSeed * 1_000_000) ^ 0x9e3779b9,
	);
	const coords = generateHexGridCircle(gridRadius);

	// Create set of available hexes (exclude ocean/coast based on position)
	const availableHexes = new Set<string>();
	for (const [q, r] of coords) {
		const distanceFromCenter = Math.sqrt(q * q + r * r);
		// Only include hexes that are not too far from center (to avoid "ocean" tiles)
		if (distanceFromCenter < gridRadius * 0.85) {
			availableHexes.add(coordToId(q, r));
		}
	}

	const countries: GeneratedCountry[] = [];
	const totalHexes = availableHexes.size;
	const avgCountrySize = Math.floor(totalHexes / numCountries);

	// Generate countries
	for (let i = 0; i < numCountries && availableHexes.size > 0; i++) {
		// Pick a random starting hex
		const availableArray = Array.from(availableHexes);
		const startHexId =
			availableArray[Math.floor(random() * availableArray.length)] ??
			availableArray[0];
		const [q, r] = startHexId.split(',').map(Number);

		// Vary country size
		const sizeVariation = 0.75 + random() * 1.45;
		const remainingCountries = Math.max(1, numCountries - i);
		const softCap = Math.max(
			3,
			Math.floor((availableHexes.size / remainingCountries) * 1.1),
		);
		const targetSize = Math.max(
			3,
			Math.min(Math.floor(avgCountrySize * sizeVariation), softCap),
		);

		const hexIds = growCountry([q, r], availableHexes, targetSize, random);

		if (hexIds.length > 0) {
			const countryId = `country-${i}`;
			const territories = hexIds.map((hexId, provinceIndex) => {
				const [hq, hr] = hexId.split(',').map(Number);
				const stats = computeProvinceStats(hq, hr, gridRadius, random);

				return {
					id: `province-${countryId}-${provinceIndex}`,
					hexId,
					name: generateProvinceName(random),
					coord: { q: hq, r: hr },
					...stats,
				};
			});

			const landTerritories = territories.filter(
				(province) => province.terrain !== 'ocean',
			);
			const assignedTerritories =
				landTerritories.length > 0 ? landTerritories : territories;

			const totalPopulation = assignedTerritories.reduce(
				(sum, province) => sum + province.population,
				0,
			);
			const totalGdp = assignedTerritories.reduce(
				(sum, province) => sum + province.gdp,
				0,
			);
			const totalSupply = assignedTerritories.reduce(
				(sum, province) => sum + province.supplyLimit,
				0,
			);
			const averageDevelopment =
				assignedTerritories.length > 0
					? Math.round(
							assignedTerritories.reduce(
								(sum, province) => sum + province.development,
								0,
							) / assignedTerritories.length,
					  )
					: 0;

			const terrainBreakdown = TERRAIN_TYPES.reduce<Record<TerrainType, number>>(
				(acc, terrain) => {
					acc[terrain] = 0;
					return acc;
				},
				{} as Record<TerrainType, number>,
			);
			for (const province of territories) {
				terrainBreakdown[province.terrain] =
					(terrainBreakdown[province.terrain] ?? 0) + 1;
			}

			const capitalProvince =
				assignedTerritories.reduce<GeneratedProvince | null>(
					(currentCapital, province) => {
						if (!currentCapital || province.population > currentCapital.population) {
							return province;
						}
						return currentCapital;
					},
					null,
				) ?? assignedTerritories[0];

			const colorSeed = random();
			const nameSeed = random();
			const governmentIndex = Math.floor(random() * GOVERNMENTS.length);
			const sphereSeed = random();

			countries.push({
				id: countryId,
				name: generateCountryName(nameSeed),
				color: generateCountryColor(colorSeed),
				hexIds: assignedTerritories.map((province) => province.hexId),
				territories: assignedTerritories,
				capital: capitalProvince?.name ?? 'Unorganized Territory',
				capitalProvinceId: capitalProvince?.id ?? '',
				population: totalPopulation,
				gdp: totalGdp,
				supplyCapacity: totalSupply,
				averageDevelopment,
				government:
					GOVERNMENTS[governmentIndex] ?? GOVERNMENTS[0],
				seedPoint: generateSpherePoint(sphereSeed + i * 0.017),
				terrainBreakdown,
			});
		}
	}

	return countries;
};
