import type { Vec2 } from '../types';

export const CLOSE_STROKE_TOLERANCE = 1e-6;

export const toLeafletPoint = ([lng, lat]: Vec2): [number, number] => [
	lat,
	lng,
];

export const ensureClosedRing = (
	points: Array<[number, number]>,
): Array<[number, number]> => {
	if (points.length === 0) {
		return points;
	}
	const [firstLat, firstLng] = points[0];
	const [lastLat, lastLng] = points[points.length - 1];
	if (
		Math.abs(firstLat - lastLat) < CLOSE_STROKE_TOLERANCE &&
		Math.abs(firstLng - lastLng) < CLOSE_STROKE_TOLERANCE
	) {
		return points;
	}
	return [...points, [firstLat, firstLng]];
};
