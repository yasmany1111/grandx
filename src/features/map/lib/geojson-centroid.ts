import type { Feature, Geometry, Polygon } from 'geojson';

const getPolygonCentroid = (polygon: Polygon): [number, number] => {
	const [outerRing] = polygon.coordinates;
	if (!outerRing || outerRing.length === 0) {
		return [0, 0];
	}
	let areaAccumulator = 0;
	let centroidLat = 0;
	let centroidLng = 0;
	for (let i = 0; i < outerRing.length - 1; i += 1) {
		const [lng1, lat1] = outerRing[i];
		const [lng2, lat2] = outerRing[i + 1];
		const step = lng1 * lat2 - lng2 * lat1;
		areaAccumulator += step;
		centroidLng += (lng1 + lng2) * step;
		centroidLat += (lat1 + lat2) * step;
	}

	const area = areaAccumulator / 2;
	if (area === 0) {
		const [lng, lat] = outerRing[0];
		return [lng, lat];
	}
	return [centroidLng / (6 * area), centroidLat / (6 * area)];
};

const getGeometryCentroid = (
	geometry: Geometry | null | undefined,
): [number, number] => {
	if (!geometry) {
		return [0, 0];
	}
	if (geometry.type === 'Polygon') {
		return getPolygonCentroid(geometry);
	}
	if (geometry.type === 'MultiPolygon') {
		const [firstPolygon] = geometry.coordinates;
		if (!firstPolygon) {
			return [0, 0];
		}
		return getPolygonCentroid({ type: 'Polygon', coordinates: firstPolygon });
	}
	return [0, 0];
};

export const getFeatureCentroid = (feature: Feature): [number, number] =>
	getGeometryCentroid(feature.geometry);
