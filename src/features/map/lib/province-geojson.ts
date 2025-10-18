import type { Feature, FeatureCollection, Polygon } from 'geojson';
import type { MapConceptData, Province, Vec2 } from '../types';
import { ensureClosedRing, toLeafletPoint } from './map-projection';

export interface ProvinceFeatureProperties {
	provinceId: string;
	ownerTag: string;
	controllerTag: string;
	terrain: Province['terrain'];
	name: string;
}

export type ProvinceFeatureCollection = FeatureCollection<
	Polygon,
	ProvinceFeatureProperties
>;

const toLeafletCoordinates = (polygon: Vec2[]): Array<[number, number]> =>
	ensureClosedRing(polygon.map((point) => toLeafletPoint(point)));

const convertProvinceToPolygon = (
	province: Province,
): Feature<Polygon, ProvinceFeatureProperties> | null => {
	if (!province.polygon || province.polygon.length < 3) {
		return null;
	}
	const ring = toLeafletCoordinates(province.polygon);
	return {
		type: 'Feature',
		geometry: {
			type: 'Polygon',
			coordinates: [ring.map(([lat, lng]) => [lng, lat])],
		},
		properties: {
			provinceId: province.id,
			ownerTag: province.ownerTag,
			controllerTag: province.controllerTag,
			terrain: province.terrain,
			name: province.name,
		},
	};
};

export const buildProvinceFeatureCollection = (
	data: MapConceptData,
): ProvinceFeatureCollection => {
	const features: Array<Feature<Polygon, ProvinceFeatureProperties>> = [];
	for (const province of data.provinces) {
		const feature = convertProvinceToPolygon(province);
		if (feature) {
			features.push(feature);
		}
	}
	return {
		type: 'FeatureCollection',
		features,
	};
};
