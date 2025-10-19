import { Canvas, type ThreeEvent } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { memo, useCallback, useEffect, useMemo } from 'react';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useGeneratedCountries, type ResolvedProvince } from '../hooks/use-generated-countries';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';
import { useMapInteraction } from '../hooks/use-map-interaction';
import type { GeneratedCountry, GeneratedProvince } from '../lib/country-generator';

const SPHERE_RADIUS = 4.9;
const TILE_RADIUS = SPHERE_RADIUS + 0.04;
const GEODESIC_DETAIL = 3;
const OCEAN_COLOR = '#0b3352';
const OCEAN_BODIES = [
	'Sea',
	'Ocean',
	'Gulf',
	'Expanse',
	'Reach',
	'Sound',
	'Channel',
	'Depths',
	'Current',
	'Gyre',
];
const OCEAN_DESCRIPTORS = [
	'Whispers',
	'Tempests',
	'Echoes',
	'Mirrors',
	'Dawn',
	'Twilight',
	'Storms',
	'Tranquility',
	'Spires',
	'Shadows',
	'Stars',
	'Embers',
	'Pearls',
	'Winds',
];

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

const hashString = (value: string): number => {
	let hash = 2166136261;
	for (let i = 0; i < value.length; i++) {
		hash ^= value.charCodeAt(i);
		hash = Math.imul(hash, 16777619);
	}
	return hash >>> 0;
};

const generateOceanName = (id: string): string => {
	const hash = hashString(id);
	const body = OCEAN_BODIES[hash % OCEAN_BODIES.length];
	const descriptor = OCEAN_DESCRIPTORS[(hash >>> 4) % OCEAN_DESCRIPTORS.length];
	if (body === 'Sea' || body === 'Ocean') {
		return `${body} of ${descriptor}`;
	}
	return `${descriptor} ${body}`;
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

type OceanProvinceRegistrar = (
	province: GeneratedProvince & { countryId?: string | null },
) => ResolvedProvince;

interface CellData {
	id: string;
	geometry: THREE.BufferGeometry;
	color: string;
	countryId: string | null;
	province: ResolvedProvince | null;
}

// Build dual polygons of a subdivided icosahedron so each vertex becomes a (mostly hex) tile.
const createGeodesicCells = (
	radius: number,
	detail: number,
	seedVectors: SeedVector[],
	countries: GeneratedCountry[],
	registerOceanProvince?: OceanProvinceRegistrar,
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

	const countryLookup = new Map<string, GeneratedCountry>();
	for (const country of countries) {
		countryLookup.set(country.id, country);
	}

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
		const cellId = `cell-${vertexIndex}`;
	cells.push({
		id: cellId,
		geometry: cellGeometry,
		color: seed?.color ?? OCEAN_COLOR,
		countryId: seed?.id ?? null,
		province: null,
	});
});

	const cellsByCountry = new Map<string, CellData[]>();
	for (const cell of cells) {
		if (!cell.countryId) continue;
		if (!cellsByCountry.has(cell.countryId)) {
			cellsByCountry.set(cell.countryId, []);
		}
		cellsByCountry.get(cell.countryId)!.push(cell);
	}

	const idNumber = (value: string): number => {
		const parts = value.split('-');
		const last = parts[parts.length - 1];
		const parsed = Number.parseInt(last, 10);
		return Number.isNaN(parsed) ? 0 : parsed;
	};

	for (const [countryId, groupedCells] of cellsByCountry.entries()) {
		const country = countryLookup.get(countryId);
		if (!country || country.territories.length === 0) {
			continue;
		}
		const sortedCells = [...groupedCells].sort(
			(a, b) => idNumber(a.id) - idNumber(b.id),
		);
		const territories = [...country.territories]
			.filter((territory) => territory.terrain !== 'ocean')
			.sort((a, b) => a.id.localeCompare(b.id));

		if (territories.length === 0) {
			continue;
		}

		for (let index = 0; index < sortedCells.length; index++) {
			const territory = territories[index % territories.length];
			const resolved: ResolvedProvince = { ...territory, countryId: country.id };
			const targetCell = sortedCells[index];
			targetCell.province = resolved;
			if (resolved.terrain === 'ocean') {
				targetCell.countryId = null;
				targetCell.color = OCEAN_COLOR;
			}
		}
	}

	const ensureOceanProvince = (cell: CellData) => {
		const baseId = cell.province?.id ?? cell.id;
		const provinceId = baseId.startsWith('ocean-') ? baseId : `ocean-${baseId}`;
		const hashed = hashString(provinceId);
		const depth = cell.province?.terrain === 'ocean'
			? cell.province.elevation
			: 400 + (hashed % 1600);
		const activity = cell.province?.terrain === 'ocean'
			? cell.province.development
			: Math.round((hashed >>> 5) % 60);

		const baseProvince: GeneratedProvince = {
			id: provinceId,
			hexId: cell.province?.hexId ?? provinceId,
			name:
				cell.province?.terrain === 'ocean' && cell.province.name
					? cell.province.name
					: generateOceanName(provinceId),
			coord: cell.province?.coord ?? { q: 0, r: 0 },
			terrain: 'ocean',
			elevation: depth,
			population: 0,
			development: activity,
			supplyLimit: 0,
			gdp: 0,
		};
		const stored =
			registerOceanProvince?.(baseProvince) ?? { ...baseProvince, countryId: null };
		cell.province = stored;
		cell.countryId = null;
		cell.color = OCEAN_COLOR;
	};

	for (const cell of cells) {
		if (!cell.province || cell.province.terrain === 'ocean') {
			ensureOceanProvince(cell);
		}
	}

	geometry.dispose();
	return cells;
};

interface HexCellProps {
	cell: CellData;
	isHovered: boolean;
	isSelected: boolean;
	isProvinceHovered: boolean;
	isProvinceSelected: boolean;
	isCountrySelected: boolean;
	onHover: (cell: CellData) => void;
	onBlur: () => void;
	onSelect: (cell: CellData) => void;
	onProvinceHover: (provinceId: string | null) => void;
	onProvinceBlur: () => void;
}

const HexCell = memo(
	({
		cell,
		isHovered,
		isSelected,
		isProvinceHovered,
		isProvinceSelected,
		isCountrySelected,
		onHover,
		onBlur,
		onSelect,
		onProvinceHover,
		onProvinceBlur,
	}: HexCellProps) => {
		const hashedTint = useMemo(() => {
			if (!cell.province) return 0;
			let hash = 0;
			for (let i = 0; i < cell.province.id.length; i++) {
				hash = (hash * 31 + cell.province.id.charCodeAt(i)) >>> 0;
			}
			return (hash % 21) / 20 - 0.5; // -0.5 to 0.5
		}, [cell.province]);

		const baseColor = useMemo(() => {
			const color = new THREE.Color(cell.color);
			if (cell.province && !cell.countryId) {
				const lightnessShift = hashedTint * 0.18;
				const hueShift = hashedTint * 0.04;
				color.offsetHSL(hueShift, 0, lightnessShift);
			} else if (isCountrySelected && cell.province) {
				const lightnessShift = hashedTint * 0.2;
				const hueShift = hashedTint * 0.08;
				color.offsetHSL(hueShift, 0, lightnessShift);
			}
			return color;
		}, [cell.color, cell.countryId, cell.province, hashedTint, isCountrySelected]);

		const emissiveColor = useMemo(() => {
			if (isProvinceSelected) {
				return baseColor.clone().multiplyScalar(0.75);
			}
			if (isProvinceHovered) {
				return baseColor.clone().multiplyScalar(0.55);
			}
			if (isSelected) {
				return baseColor.clone().multiplyScalar(0.6);
			}
			if (isHovered) {
				return baseColor.clone().multiplyScalar(0.35);
			}
			return new THREE.Color('#000000');
		}, [baseColor, isHovered, isProvinceHovered, isProvinceSelected, isSelected]);

		const opacity = isProvinceSelected
			? 0.98
			: isProvinceHovered
				? 0.92
				: isSelected
					? 0.9
				: isHovered
					? 0.8
					: 0.72;

		const emissiveIntensity = isProvinceSelected
			? 0.85
			: isProvinceHovered
				? 0.6
				: isSelected
					? 0.45
					: isHovered
						? 0.3
						: 0;

		const handlePointerOver = useCallback(
			(event: ThreeEvent<PointerEvent>) => {
				event.stopPropagation();
				onHover(cell);
				if (cell.countryId) {
					if (typeof document !== 'undefined') {
						document.body.style.cursor = 'pointer';
					}
					if (isCountrySelected && cell.province) {
						onProvinceHover(cell.province.id);
					} else {
						onProvinceHover(null);
					}
				} else if (cell.province) {
					if (typeof document !== 'undefined') {
						document.body.style.cursor = 'pointer';
					}
					onProvinceHover(cell.province.id);
				} else {
					onProvinceHover(null);
				}
			},
			[cell, isCountrySelected, onHover, onProvinceHover],
		);

		const handlePointerOut = useCallback(
			(event: ThreeEvent<PointerEvent>) => {
				event.stopPropagation();
				if (typeof document !== 'undefined') {
					document.body.style.cursor = 'default';
				}
				onBlur();
				onProvinceBlur();
			},
			[onBlur, onProvinceBlur],
		);

		const handleClick = useCallback(
			(event: ThreeEvent<PointerEvent>) => {
				event.stopPropagation();
				onSelect(cell);
			},
			[cell, onSelect],
		);

		return (
			<mesh
				geometry={cell.geometry}
				onPointerOver={handlePointerOver}
				onPointerOut={handlePointerOut}
				onClick={handleClick}
			>
				<meshStandardMaterial
					color={baseColor}
					side={THREE.DoubleSide}
					flatShading
					transparent
					opacity={opacity}
					emissive={emissiveColor}
					emissiveIntensity={emissiveIntensity}
				/>
			</mesh>
		);
	},
);

HexCell.displayName = 'HexCell';

// Component to render hexagons on sphere
const HexGrid = () => {
	const { countries, registerOceanProvince } = useGeneratedCountries(24, 20);
	const hoveredTileId = useHexMapInteraction((state) => state.hoveredTileId);
	const selectedTileId = useHexMapInteraction((state) => state.selectedTileId);
	const setHoveredTile = useHexMapInteraction((state) => state.setHoveredTile);
	const setSelectedTile = useHexMapInteraction((state) => state.setSelectedTile);
	const hoveredProvinceId = useMapInteraction((state) => state.hoveredProvinceId);
	const selectedProvinceId = useMapInteraction((state) => state.selectedProvinceId);
	const setHoveredProvince = useMapInteraction((state) => state.setHoveredProvince);
	const setSelectedProvince = useMapInteraction((state) => state.setSelectedProvince);
	const handleProvinceBlur = useCallback(
		() => setHoveredProvince(null),
		[setHoveredProvince],
	);

	const seedVectors = useMemo<SeedVector[]>(() => {
		return countries.map((country) => ({
			id: country.id,
			color: country.color,
			vector: latLngToVector3(country.seedPoint.lat, country.seedPoint.lng, 1).normalize(),
		}));
	}, [countries]);

	const cells = useMemo(
		() =>
			createGeodesicCells(
				TILE_RADIUS,
				GEODESIC_DETAIL,
				seedVectors,
				countries,
				registerOceanProvince,
			),
		[countries, registerOceanProvince, seedVectors],
	);

	useEffect(
		() => () => {
			cells.forEach((cell) => cell.geometry.dispose());
		},
		[cells],
	);

	const handleHover = useCallback(
		(cell: CellData) => {
			setHoveredTile(cell.countryId);
			if (!cell.countryId) {
				setHoveredProvince(cell.province?.id ?? null);
				return;
			}
			if (selectedTileId === cell.countryId && cell.province) {
				setHoveredProvince(cell.province.id);
			} else {
				setHoveredProvince(null);
			}
		},
		[selectedTileId, setHoveredProvince, setHoveredTile],
	);

	const handleBlur = useCallback(() => {
		setHoveredTile(null);
		setHoveredProvince(null);
	}, [setHoveredProvince, setHoveredTile]);

	const handleSelect = useCallback(
		(cell: CellData) => {
			const countryId = cell.countryId;
			if (!countryId) {
				setSelectedTile(null);
				setSelectedProvince(cell.province?.id ?? null);
				return;
			}

			const nextProvinceId = cell.province?.id ?? null;

			if (selectedTileId !== countryId) {
				setSelectedTile(countryId);
			}

			setSelectedProvince(nextProvinceId);
		},
		[selectedTileId, setSelectedProvince, setSelectedTile],
	);

	return (
		<>
			{cells.map((cell) => {
				const isHovered =
					!!cell.countryId && hoveredTileId === cell.countryId;
				const isSelected =
					!!cell.countryId && selectedTileId === cell.countryId;
				const isProvinceHovered =
					!!cell.province && hoveredProvinceId === cell.province.id;
				const isProvinceSelected =
					!!cell.province && selectedProvinceId === cell.province.id;
				const isCountrySelected = !!cell.countryId && selectedTileId === cell.countryId;
				return (
					<HexCell
						key={cell.id}
						cell={cell}
						isHovered={isHovered}
						isSelected={isSelected}
						isProvinceHovered={isProvinceHovered}
						isProvinceSelected={isProvinceSelected}
						isCountrySelected={isCountrySelected}
						onHover={handleHover}
						onBlur={handleBlur}
						onSelect={handleSelect}
						onProvinceHover={setHoveredProvince}
						onProvinceBlur={handleProvinceBlur}
					/>
				);
			})}
		</>
	);
};

export const D3HexMap = () => {
	const setSelectedTile = useHexMapInteraction((state) => state.setSelectedTile);
	const setHoveredTile = useHexMapInteraction((state) => state.setHoveredTile);
	const setSelectedProvince = useMapInteraction((state) => state.setSelectedProvince);
	const setHoveredProvince = useMapInteraction((state) => state.setHoveredProvince);

	return (
		<div className="h-full w-full">
			<Canvas
				camera={{ position: [0, 0, 10], fov: 50 }}
				onPointerMissed={() => {
					setSelectedTile(null);
					setSelectedProvince(null);
				}}
				onPointerLeave={() => {
					setHoveredTile(null);
					setHoveredProvince(null);
					if (typeof document !== 'undefined') {
						document.body.style.cursor = 'default';
					}
				}}
			>
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
