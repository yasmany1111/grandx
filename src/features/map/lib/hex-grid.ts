import type { HexCoordinate, Vec2 } from '../types';

/**
 * Hex grid utilities using axial coordinates (q, r)
 * Using flat-top hexagon orientation
 */

// Hex layout constants
export const HEX_SIZE = 30; // radius of hexagon
export const HEX_WIDTH = Math.sqrt(3) * HEX_SIZE;
export const HEX_HEIGHT = 2 * HEX_SIZE;

/**
 * Create a unique string ID from hex coordinates
 */
export const hexToId = (coord: HexCoordinate): string => {
	return `${coord.q},${coord.r}`;
};

/**
 * Parse hex coordinates from ID string
 */
export const idToHex = (id: string): HexCoordinate => {
	const [q, r] = id.split(',').map(Number);
	return { q, r };
};

/**
 * Check if two hex coordinates are equal
 */
export const hexEquals = (a: HexCoordinate, b: HexCoordinate): boolean => {
	return a.q === b.q && a.r === b.r;
};

/**
 * Get the six neighbor coordinates of a hex (flat-top orientation)
 */
export const getNeighborCoords = (coord: HexCoordinate): HexCoordinate[] => {
	const directions: HexCoordinate[] = [
		{ q: 1, r: 0 }, // right
		{ q: 1, r: -1 }, // top-right
		{ q: 0, r: -1 }, // top-left
		{ q: -1, r: 0 }, // left
		{ q: -1, r: 1 }, // bottom-left
		{ q: 0, r: 1 }, // bottom-right
	];

	return directions.map((dir) => ({
		q: coord.q + dir.q,
		r: coord.r + dir.r,
	}));
};

/**
 * Convert hex axial coordinates to pixel position (center of hex)
 * Using flat-top orientation
 */
export const hexToPixel = (coord: HexCoordinate, hexSize = HEX_SIZE): Vec2 => {
	const x = hexSize * (Math.sqrt(3) * coord.q + (Math.sqrt(3) / 2) * coord.r);
	const y = hexSize * ((3 / 2) * coord.r);
	return [x, y];
};

/**
 * Convert pixel coordinates to hex axial coordinates
 * Using flat-top orientation
 */
export const pixelToHex = (pixel: Vec2, hexSize = HEX_SIZE): HexCoordinate => {
	const [x, y] = pixel;
	const q = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / hexSize;
	const r = ((2 / 3) * y) / hexSize;

	return hexRound({ q, r });
};

/**
 * Round fractional hex coordinates to nearest hex
 */
export const hexRound = (coord: { q: number; r: number }): HexCoordinate => {
	const s = -coord.q - coord.r;
	let q = Math.round(coord.q);
	let r = Math.round(coord.r);
	const roundedS = Math.round(s);

	const qDiff = Math.abs(q - coord.q);
	const rDiff = Math.abs(r - coord.r);
	const sDiff = Math.abs(roundedS - s);

	if (qDiff > rDiff && qDiff > sDiff) {
		q = -r - roundedS;
	} else if (rDiff > sDiff) {
		r = -q - roundedS;
	}

	return { q, r };
};

/**
 * Calculate distance between two hexes (in hex steps)
 */
export const hexDistance = (a: HexCoordinate, b: HexCoordinate): number => {
	return (
		(Math.abs(a.q - b.q) +
			Math.abs(a.q + a.r - b.q - b.r) +
			Math.abs(a.r - b.r)) /
		2
	);
};

/**
 * Get all hex coordinates in a rectangular grid
 */
export const generateHexGrid = (
	width: number,
	height: number,
): HexCoordinate[] => {
	const hexes: HexCoordinate[] = [];

	for (let r = 0; r < height; r++) {
		const offset = Math.floor(r / 2);
		for (let q = -offset; q < width - offset; q++) {
			hexes.push({ q, r });
		}
	}

	return hexes;
};

/**
 * Get the six corner points of a hexagon (for rendering)
 * Returns pixel coordinates relative to hex center
 */
export const getHexCorners = (hexSize = HEX_SIZE): Vec2[] => {
	const corners: Vec2[] = [];
	for (let i = 0; i < 6; i++) {
		const angle = (Math.PI / 180) * (60 * i + 30); // flat-top orientation
		const x = hexSize * Math.cos(angle);
		const y = hexSize * Math.sin(angle);
		corners.push([x, y]);
	}
	return corners;
};

/**
 * Check if a point is inside a hexagon
 */
export const isPointInHex = (
	point: Vec2,
	hexCenter: Vec2,
	hexSize = HEX_SIZE,
): boolean => {
	const [px, py] = point;
	const [cx, cy] = hexCenter;

	// Convert to hex coordinates and round
	const hex = pixelToHex([px - cx, py - cy], hexSize);
	const center = pixelToHex([0, 0], hexSize);

	return hexEquals(hex, center);
};
