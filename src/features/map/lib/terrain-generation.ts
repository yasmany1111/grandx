import type { HexTile, TerrainType } from '../types';
import { generateHexGrid, getNeighborCoords, hexToId } from './hex-grid';

/**
 * Simple 2D noise function using sine waves
 * Returns value between 0 and 1
 */
const simpleNoise = (
	x: number,
	y: number,
	seed: number,
	frequency = 1,
): number => {
	const value =
		Math.sin(x * frequency + seed) * Math.cos(y * frequency + seed) +
		Math.sin(x * frequency * 2 + seed * 1.5) * 0.5 +
		Math.cos(y * frequency * 2 + seed * 2) * 0.5;

	return (value + 2) / 4; // normalize to 0-1
};

/**
 * Multi-octave noise for more natural terrain
 */
const fractalNoise = (
	x: number,
	y: number,
	seed: number,
	octaves = 4,
): number => {
	let value = 0;
	let amplitude = 1;
	let frequency = 0.05;
	let maxValue = 0;

	for (let i = 0; i < octaves; i++) {
		value += simpleNoise(x, y, seed + i, frequency) * amplitude;
		maxValue += amplitude;
		amplitude *= 0.5;
		frequency *= 2;
	}

	return value / maxValue;
};

/**
 * Determine terrain type based on elevation and moisture
 */
const getTerrainType = (
	elevation: number,
	moisture: number,
	temperature: number,
): TerrainType => {
	// Ocean
	if (elevation < 0.35) {
		return 'ocean';
	}

	// Coast
	if (elevation < 0.42) {
		return 'coast';
	}

	// Mountain
	if (elevation > 0.75) {
		return 'mountain';
	}

	// Desert (low moisture, high temperature)
	if (moisture < 0.3 && temperature > 0.6) {
		return 'desert';
	}

	// Forest (high moisture)
	if (moisture > 0.55) {
		return 'forest';
	}

	// Plains (default)
	return 'plains';
};

/**
 * Generate terrain stats based on terrain type
 */
const getTerrainStats = (
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
				population: 500000 + Math.floor(elevation * 300000),
			};
		case 'plains':
			return {
				development: 50 + Math.floor(elevation * 30),
				supplyLimit: 20 + Math.floor(elevation * 15),
				population: 600000 + Math.floor(elevation * 400000),
			};
		case 'forest':
			return {
				development: 40 + Math.floor(elevation * 25),
				supplyLimit: 12 + Math.floor(elevation * 8),
				population: 300000 + Math.floor(elevation * 200000),
			};
		case 'mountain':
			return {
				development: 25 + Math.floor(elevation * 15),
				supplyLimit: 8 + Math.floor(elevation * 5),
				population: 100000 + Math.floor(elevation * 150000),
			};
		case 'desert':
			return {
				development: 20 + Math.floor(elevation * 10),
				supplyLimit: 6 + Math.floor(elevation * 4),
				population: 50000 + Math.floor(elevation * 100000),
			};
	}
};

export interface TerrainGenerationOptions {
	width: number;
	height: number;
	seed?: number;
	oceanLevel?: number; // 0-1, default 0.35
	mountainLevel?: number; // 0-1, default 0.75
}

/**
 * Generate a complete hex map with procedural terrain
 */
export const generateHexMap = (
	options: TerrainGenerationOptions,
): Map<string, HexTile> => {
	const { width, height, seed = Math.random() * 10000 } = options;

	const tiles = new Map<string, HexTile>();
	const coords = generateHexGrid(width, height);

	// First pass: generate elevation and terrain types
	for (const coord of coords) {
		const { q, r } = coord;

		// Generate noise values
		const elevation = fractalNoise(q, r, seed, 5);
		const moisture = fractalNoise(q, r, seed + 1000, 4);
		const temperature = fractalNoise(q, r, seed + 2000, 3);

		// Adjust elevation for island generation (lower at edges)
		const centerQ = width / 2;
		const centerR = height / 2;
		const distanceFromCenter = Math.sqrt(
			(q - centerQ) ** 2 + (r - centerR) ** 2,
		);
		const maxDistance = Math.sqrt((width / 2) ** 2 + (height / 2) ** 2);
		const edgeFalloff = 1 - (distanceFromCenter / maxDistance) ** 1.5;
		const adjustedElevation = elevation * 0.7 + edgeFalloff * 0.3;

		const terrain = getTerrainType(adjustedElevation, moisture, temperature);
		const stats = getTerrainStats(terrain, adjustedElevation);

		const id = hexToId(coord);
		tiles.set(id, {
			coord,
			id,
			terrain,
			elevation: Math.floor(adjustedElevation * 100),
			neighbors: [], // will be filled in next pass
			ownerTag: terrain === 'ocean' ? null : 'neutral',
			controllerTag: terrain === 'ocean' ? null : 'neutral',
			...stats,
		});
	}

	// Second pass: establish neighbor relationships
	for (const [_id, tile] of tiles.entries()) {
		const neighborCoords = getNeighborCoords(tile.coord);
		const neighborIds = neighborCoords
			.map(hexToId)
			.filter((nId) => tiles.has(nId));
		tile.neighbors = neighborIds;
	}

	return tiles;
};

/**
 * Find all land tiles that are adjacent to ocean (for continent/island identification)
 */
export const findCoastTiles = (tiles: Map<string, HexTile>): HexTile[] => {
	const coastTiles: HexTile[] = [];

	for (const tile of tiles.values()) {
		if (tile.terrain === 'ocean') continue;

		const hasOceanNeighbor = tile.neighbors.some((neighborId) => {
			const neighbor = tiles.get(neighborId);
			return neighbor?.terrain === 'ocean';
		});

		if (hasOceanNeighbor) {
			coastTiles.push(tile);
		}
	}

	return coastTiles;
};

/**
 * Find connected land masses (continents/islands)
 */
export const findLandMasses = (tiles: Map<string, HexTile>): HexTile[][] => {
	const visited = new Set<string>();
	const landMasses: HexTile[][] = [];

	const floodFill = (startTile: HexTile): HexTile[] => {
		const mass: HexTile[] = [];
		const queue: HexTile[] = [startTile];
		visited.add(startTile.id);

		while (queue.length > 0) {
			const current = queue.shift()!;
			mass.push(current);

			for (const neighborId of current.neighbors) {
				if (visited.has(neighborId)) continue;
				const neighbor = tiles.get(neighborId);
				if (!neighbor || neighbor.terrain === 'ocean') continue;

				visited.add(neighborId);
				queue.push(neighbor);
			}
		}

		return mass;
	};

	for (const tile of tiles.values()) {
		if (tile.terrain === 'ocean' || visited.has(tile.id)) continue;
		const landMass = floodFill(tile);
		if (landMass.length > 0) {
			landMasses.push(landMass);
		}
	}

	return landMasses;
};
