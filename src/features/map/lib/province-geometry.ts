import { useEffect, useMemo } from 'react';
import { EdgesGeometry, Shape, ShapeGeometry, Vector2, Vector3 } from 'three';

import type { Province, Vec2 } from '../types';
import { MAP_HEIGHT, MAP_WIDTH, toWorldPosition } from './map-constants';

interface ProvinceGeometry {
	geometry: ShapeGeometry;
	edges: EdgesGeometry;
	centroid: Vector3;
}

const toWorldPoint = ([x, y]: Vec2) => ({
		worldX: toWorldPosition(x, MAP_WIDTH),
		worldZ: toWorldPosition(y, MAP_HEIGHT),
	});

const ensureCounterClockwise = (points: Vector2[]): Vector2[] => {
	let area = 0;
	for (let i = 0; i < points.length; i += 1) {
		const current = points[i];
		const next = points[(i + 1) % points.length];
		area += current.x * next.y - next.x * current.y;
	}
	if (area < 0) {
		return [...points].reverse();
	}
	return points;
};

export const useProvinceGeometry = (province: Province): ProvinceGeometry => {
	const geometryBundle = useMemo(() => {
		const centroidWorld = new Vector3(
			toWorldPosition(province.centroid[0], MAP_WIDTH),
			0.02,
			toWorldPosition(province.centroid[1], MAP_HEIGHT),
		);

		const localPoints = province.polygon.map((point) => {
			const { worldX, worldZ } = toWorldPoint(point);
			return new Vector2(worldX - centroidWorld.x, worldZ - centroidWorld.z);
		});

		const normalizedPoints = ensureCounterClockwise(localPoints);
		const shape = new Shape(normalizedPoints);
		const geometry = new ShapeGeometry(shape, 1);
		geometry.rotateX(-Math.PI / 2);
		const edges = new EdgesGeometry(geometry, 4);

		return {
			geometry,
			edges,
			centroid: centroidWorld,
		};
	}, [province.centroid, province.polygon]);

	useEffect(() => {
		const { geometry, edges } = geometryBundle;
		return () => {
			geometry.dispose();
			edges.dispose();
		};
	}, [geometryBundle]);

	return geometryBundle;
};
