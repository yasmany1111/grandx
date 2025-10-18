/**
 * Hex Layout utility for converting between axial coordinates and pixel positions
 * Based on flat-top hexagon orientation
 */

export class HexLayout {
	private readonly size: number;
	private readonly sqrt3: number = Math.sqrt(3);

	constructor(size: number) {
		this.size = size;
	}

	/**
	 * Convert axial coordinates (q, r) to pixel position (x, y)
	 */
	axialToPixel(q: number, r: number): [number, number] {
		const x = this.size * (this.sqrt3 * q + (this.sqrt3 / 2) * r);
		const y = this.size * ((3 / 2) * r);
		return [x, y];
	}

	/**
	 * Convert pixel position to axial coordinates
	 */
	pixelToAxial(x: number, y: number): [number, number] {
		const q = ((this.sqrt3 / 3) * x - (1 / 3) * y) / this.size;
		const r = ((2 / 3) * y) / this.size;
		return this.axialRound(q, r);
	}

	/**
	 * Round fractional axial coordinates to nearest hex
	 */
	private axialRound(q: number, r: number): [number, number] {
		const s = -q - r;
		let rq = Math.round(q);
		let rr = Math.round(r);
		const rs = Math.round(s);

		const qDiff = Math.abs(rq - q);
		const rDiff = Math.abs(rr - r);
		const sDiff = Math.abs(rs - s);

		if (qDiff > rDiff && qDiff > sDiff) {
			rq = -rr - rs;
		} else if (rDiff > sDiff) {
			rr = -rq - rs;
		}

		return [rq, rr];
	}
}

/**
 * Generate hex grid coordinates in a circular pattern
 */
export const generateHexGridCircle = (
	radius: number,
): Array<[number, number]> => {
	const coords: Array<[number, number]> = [];

	for (let q = -radius; q <= radius; q++) {
		const r1 = Math.max(-radius, -q - radius);
		const r2 = Math.min(radius, -q + radius);

		for (let r = r1; r <= r2; r++) {
			coords.push([q, r]);
		}
	}

	return coords;
};
