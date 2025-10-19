import type { HexCoordinate, HexTile } from '../types';
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

export interface GeneratedCountry {
	id: string;
	name: string;
	color: string;
	hexIds: string[];
	capital?: string;
	population: number;
	gdp: number;
	government: string;
	seedPoint: { lat: number; lng: number };
}

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
	gridRadius: number,
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
		const neighbors = getNeighbors(q, r);
		// Sort neighbors randomly to get more natural shapes
		neighbors.sort(() => Math.random() - 0.5);

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

export const generateCountries = (
	gridRadius: number,
	numCountries: number = 15,
	seed: number = Math.random(),
): GeneratedCountry[] => {
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
			availableArray[
				Math.floor((seed + i) * availableArray.length) % availableArray.length
			];
		const [q, r] = startHexId.split(',').map(Number);

		// Vary country size
		const sizeVariation = 0.5 + ((seed + i * 0.37) % 1) * 1.5;
		const targetSize = Math.floor(avgCountrySize * sizeVariation);

		const hexIds = growCountry([q, r], availableHexes, targetSize, gridRadius);

		if (hexIds.length > 0) {
			const countryId = `country-${i}`;
			const population =
				hexIds.length * (500000 + Math.floor((seed + i) * 2000000));
			const gdp = Math.floor(population * (5000 + ((seed + i * 13) % 15000)));

			countries.push({
				id: countryId,
				name: generateCountryName(seed + i),
				color: generateCountryColor(seed + i),
				hexIds,
				capital: hexIds[Math.floor(hexIds.length / 2)], // Middle hex as capital
				population,
				gdp,
				government:
					GOVERNMENTS[
						Math.floor((seed + i * 23) * GOVERNMENTS.length) %
							GOVERNMENTS.length
					],
				seedPoint: generateSpherePoint(seed + i + 0.333),
			});
		}
	}

	return countries;
};
