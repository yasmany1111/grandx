import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useEffect, useMemo } from 'react';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useGeneratedCountries } from '../hooks/use-generated-countries';

const SPHERE_RADIUS = 4.9;
const TILE_RADIUS = SPHERE_RADIUS + 0.04;
const GEODESIC_DETAIL = 3;

// Convert lat/lng to 3D position on sphere
const latLngToVector3 = (
	lat: number,
	lng: number,
	radius: number,
): THREE.Vector3 => {
	const phi = (90 - lat) * (Math.PI / 180);
	const theta = (lng + 180) * (Math.PI / 180);

	const x = -radius * Math.sin(phi) * Math.cos(theta);
	const y = radius * Math.cos(phi);
	const z = radius * Math.sin(phi) * Math.sin(theta);

	return new THREE.Vector3(x, y, z);
};

const createTangentBasis = (normal: THREE.Vector3) => {
	const reference =
		Math.abs(normal.y) < 0.99 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(1, 0, 0);
	const tangent = new THREE.Vector3().crossVectors(reference, normal).normalize();
	const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize();
	return { tangent, bitangent };
};

const angleAroundNormal = (
	point: THREE.Vector3,
	tangent: THREE.Vector3,
	bitangent: THREE.Vector3,
): number => {
	const x = point.dot(tangent);
	const y = point.dot(bitangent);
	return Math.atan2(y, x);
};

interface SeedVector {
	id: string;
	color: string;
	vector: THREE.Vector3;
}

const findNearestCountrySeed = (
	normal: THREE.Vector3,
	seeds: SeedVector[],
	thresholdRadians = THREE.MathUtils.degToRad(40),
): SeedVector | null => {
	if (seeds.length === 0) return null;

	let best: SeedVector | null = null;
	let maxDot = -Infinity;

	for (const seed of seeds) {
		const dot = normal.dot(seed.vector);
		if (dot > maxDot) {
			maxDot = dot;
			best = seed;
		}
	}

	if (!best) {
		return null;
	}

	const angle = Math.acos(Math.min(1, Math.max(-1, maxDot)));
	return angle <= thresholdRadians ? best : null;
};

interface CellData {
	geometry: THREE.BufferGeometry;
	color: string;
	countryId: string | null;
}

// Build dual polygons of a subdivided icosahedron so each vertex becomes a (mostly hex) tile.
const createGeodesicCells = (
	radius: number,
	detail: number,
	seedVectors: SeedVector[],
): CellData[] => {
	const baseGeometry = new THREE.IcosahedronGeometry(1, detail);
	// Remove per-face attributes so mergeVertices can weld shared positions
	baseGeometry.deleteAttribute('normal');
	baseGeometry.deleteAttribute('uv');
	const geometry = mergeVertices(baseGeometry);
	baseGeometry.dispose();

	const positionAttr = geometry.getAttribute('position') as THREE.BufferAttribute;
	const indexAttr = geometry.getIndex();
	if (!indexAttr) {
		geometry.dispose();
		return [];
	}
	const indexArray = indexAttr.array;

	const vertices = Array.from({ length: positionAttr.count }, (_, i) =>
		new THREE.Vector3().fromBufferAttribute(positionAttr, i).normalize(),
	);

	type Face = {
		indices: [number, number, number];
		centroid: THREE.Vector3;
	};
	const faces: Face[] = [];
	for (let i = 0; i < indexArray.length; i += 3) {
		const a = indexArray[i] as number;
		const b = indexArray[i + 1] as number;
		const c = indexArray[i + 2] as number;
		const centroid = new THREE.Vector3()
			.add(vertices[a])
			.add(vertices[b])
			.add(vertices[c])
			.divideScalar(3)
			.normalize();
		faces.push({ indices: [a, b, c], centroid });
	}

	const vertexFaces = new Map<number, number[]>();
	faces.forEach((face, faceIndex) => {
		for (const vertexIndex of face.indices) {
			if (!vertexFaces.has(vertexIndex)) {
				vertexFaces.set(vertexIndex, []);
			}
			vertexFaces.get(vertexIndex)!.push(faceIndex);
		}
	});

	const tileOffset = radius;

	const cells: CellData[] = [];

	vertexFaces.forEach((faceIndices, vertexIndex) => {
		const normal = vertices[vertexIndex];
		const { tangent, bitangent } = createTangentBasis(normal);

		const orderedCentroids = faceIndices
			.map((faceIndex) => faces[faceIndex].centroid.clone())
			.sort((a, b) => {
				const angleA = angleAroundNormal(a, tangent, bitangent);
				const angleB = angleAroundNormal(b, tangent, bitangent);
				return angleA - angleB;
			});

		const polygonPoints = orderedCentroids.map((point) =>
			point.normalize().multiplyScalar(tileOffset),
		);
		const center = normal.clone().multiplyScalar(tileOffset);

		const positions: number[] = [];
		for (let i = 0; i < polygonPoints.length; i++) {
			const current = polygonPoints[i];
			const next = polygonPoints[(i + 1) % polygonPoints.length];
			positions.push(
				center.x,
				center.y,
				center.z,
				current.x,
				current.y,
				current.z,
				next.x,
				next.y,
				next.z,
			);
		}

		const cellGeometry = new THREE.BufferGeometry();
		cellGeometry.setAttribute(
			'position',
			new THREE.Float32BufferAttribute(positions, 3),
		);
		cellGeometry.computeVertexNormals();

		const seed = findNearestCountrySeed(normal, seedVectors);
			cells.push({
				geometry: cellGeometry,
				color: seed?.color ?? '#1e4d6b',
				countryId: seed?.id ?? null,
			});
		});

	geometry.dispose();
	return cells;
};

// Component to render hexagons on sphere
const HexGrid = () => {
	const { countries } = useGeneratedCountries(24, 20);

	const seedVectors = useMemo<SeedVector[]>(() => {
		return countries.map((country) => ({
			id: country.id,
			color: country.color,
			vector: latLngToVector3(country.seedPoint.lat, country.seedPoint.lng, 1).normalize(),
		}));
	}, [countries]);

	const cells = useMemo(
		() => createGeodesicCells(TILE_RADIUS, GEODESIC_DETAIL, seedVectors),
		[seedVectors],
	);

	useEffect(
		() => () => {
			cells.forEach((cell) => cell.geometry.dispose());
		},
		[cells],
	);

	return (
		<>
			{cells.map((cell, index) => (
				<mesh key={index} geometry={cell.geometry}>
					<meshStandardMaterial
						color={cell.color}
						side={THREE.DoubleSide}
						flatShading
					/>
				</mesh>
			))}
		</>
	);
};

export const D3HexMap = () => {
	return (
		<div className="h-full w-full">
			<Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
				<color attach="background" args={['#0a0f1e']} />
				<ambientLight intensity={0.5} />
				<directionalLight position={[10, 10, 5]} intensity={1} />

				{/* Sphere */}
				<mesh>
					<sphereGeometry args={[SPHERE_RADIUS, 64, 64]} />
					<meshStandardMaterial color="#0c2a3f" />
				</mesh>

				{/* Hexagons */}
				<HexGrid />

				<OrbitControls enablePan={false} />
			</Canvas>
		</div>
	);
};
