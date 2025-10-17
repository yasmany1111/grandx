import { useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MapControls, OrthographicCamera } from '@react-three/drei';
import { Color, MeshStandardMaterial } from 'three';

import { MOCK_MAP_DATA } from '../data/mockWorld';
import { useMapInteraction } from '../hooks/use-map-interaction';
import { getProvinceFill, getBorderColor } from '../lib/map-colors';
import { getProvinceNeighbors } from '../lib/province-helpers';
import type { Province } from '../types';

const MAP_WIDTH = 20;
const MAP_HEIGHT = 12;

const useProvinceMaterial = (color: string, intensity: number) => {
	return useMemo(() => {
		const instance = new MeshStandardMaterial({
			color,
			emissive: new Color(color).multiplyScalar(intensity * 0.2),
			emissiveIntensity: intensity,
			metalness: 0.18,
			roughness: 0.68,
		});
		return instance;
	}, [color, intensity]);
};

const seededRandom = (seed: string): number => {
	let h = 1779033703 ^ seed.length;
	for (let i = 0; i < seed.length; i += 1) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h >>> 0) / 4294967295;
};

const getProvinceScale = (province: Province): [number, number] => {
	const random = seededRandom(province.id);
	const width = 1.4 + random * 1.6;
	const height = 1 + random * 1.4;
	return [width, height];
};

const ProvinceMesh = ({ province }: { province: Province }) => {
	const { mapMode, hoveredProvinceId, selectedProvinceId, setHoveredProvince, setSelectedProvince } =
		useMapInteraction();

	const country = useMemo(
		() => MOCK_MAP_DATA.countries.find((item) => item.tag === province.ownerTag),
		[province.ownerTag],
	);

	const fill = getProvinceFill(province, mapMode, country);
	const isHovered = hoveredProvinceId === province.id;
	const isSelected = selectedProvinceId === province.id;
	const material = useProvinceMaterial(fill, isSelected ? 1.4 : isHovered ? 1 : 0.6);

	useEffect(() => () => material.dispose(), [material]);

	const [width, height] = getProvinceScale(province);
	const position: [number, number, number] = [
		(province.centroid[0] - 0.5) * MAP_WIDTH,
		(province.centroid[1] - 0.5) * -MAP_HEIGHT,
		0,
	];

	const handlePointerOver = useCallback(() => setHoveredProvince(province.id), [province.id, setHoveredProvince]);
	const handlePointerOut = useCallback(() => setHoveredProvince(null), [setHoveredProvince]);
	const handleClick = useCallback(() => setSelectedProvince(province.id), [province.id, setSelectedProvince]);

	return (
		<group position={position}>
			<mesh
				onPointerOver={handlePointerOver}
				onPointerOut={handlePointerOut}
				onClick={handleClick}
				material={material}
				castShadow
				receiveShadow
			>
				<planeGeometry args={[width, height, 8, 8]} />
			</mesh>
			{isSelected ? (
				<mesh position={[0, 0, 0.1]}>
					<planeGeometry args={[width * 0.9, height * 0.9, 1, 1]} />
					<meshBasicMaterial color="white" transparent opacity={0.08} />
				</mesh>
			) : null}
		</group>
	);
};

const ProvinceConnections = ({ province }: { province: Province }) => {
	const neighbors = useMemo(() => getProvinceNeighbors(province.id, MOCK_MAP_DATA.provinces), [province.id]);
	return (
		<group>
			{neighbors.map((neighbor) => {
				const start: [number, number, number] = [
					(province.centroid[0] - 0.5) * MAP_WIDTH,
					(province.centroid[1] - 0.5) * -MAP_HEIGHT,
					0.01,
				];
				const end: [number, number, number] = [
					(neighbor.centroid[0] - 0.5) * MAP_WIDTH,
					(neighbor.centroid[1] - 0.5) * -MAP_HEIGHT,
					0.01,
				];
				return (
					<line key={`${province.id}-${neighbor.id}`}>
						<bufferGeometry>
							<bufferAttribute
								attach="attributes-position"
								array={new Float32Array([...start, ...end])}
								count={2}
								itemSize={3}
							/>
						</bufferGeometry>
						<lineBasicMaterial color="#1f2937" linewidth={1} />
					</line>
				);
			})}
		</group>
	);
};

const WaterSurface = () => {
	const material = useMemo(
		() =>
			new MeshStandardMaterial({
				color: '#111f3f',
				metalness: 0.85,
				roughness: 0.22,
				envMapIntensity: 0.7,
				transparent: true,
				opacity: 0.92,
			}),
		[],
	);
	useEffect(() => () => material.dispose(), [material]);
	const deepTone = useMemo(() => new Color('#0e1726'), []);
	const shallowTone = useMemo(() => new Color('#1f3e6b'), []);

	useFrame(({ clock }) => {
		const time = clock.getElapsedTime();
		const tint = 0.52 + Math.sin(time * 0.15) * 0.04;
		material.color.lerpColors(deepTone, shallowTone, tint);
	});

	return (
		<mesh position={[0, 0, -0.2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[MAP_WIDTH * 1.4, MAP_HEIGHT * 1.6, 32, 32]} />
			<primitive object={material} attach="material" />
		</mesh>
	);
};

const SceneBackdrop = () => {
	const { mapMode } = useMapInteraction();
	const tone = getBorderColor(mapMode);
	return (
		<mesh position={[0, 0, -0.6]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[MAP_WIDTH * 1.6, MAP_HEIGHT * 1.8, 1, 1]} />
			<meshStandardMaterial color={tone} metalness={0.1} roughness={0.95} />
		</mesh>
	);
};

const MapScene = () => {
	const { mapMode } = useMapInteraction();
	const borderColor = getBorderColor(mapMode);

	return (
		<group>
			<ambientLight intensity={0.8} />
			<directionalLight
				color="#f1e6d2"
				position={[15, 25, 20]}
				intensity={1.1}
				castShadow
			/>
			<directionalLight color="#89b7ff" position={[-10, 8, 18]} intensity={0.45} />
			<SceneBackdrop />
			<WaterSurface />
			{MOCK_MAP_DATA.provinces.map((province) => (
				<ProvinceConnections key={`${province.id}-connections`} province={province} />
			))}
			{MOCK_MAP_DATA.provinces.map((province) => (
				<ProvinceMesh key={province.id} province={province} />
			))}
			<mesh position={[0, 0, -0.1]}>
				<planeGeometry args={[MAP_WIDTH * 1.1, MAP_HEIGHT * 1.2]} />
				<meshBasicMaterial color={borderColor} wireframe opacity={0.2} transparent />
			</mesh>
			<Environment preset="sunset" />
		</group>
	);
};

export const MapCanvas = () => {
	return (
		<div className="h-full w-full">
			<Canvas className="h-full w-full" shadows dpr={[1, 1.8]}>
				<color attach="background" args={[new Color('#05070e')]} />
				<fog attach="fog" args={[new Color('#05070e'), 12, 40]} />
				<OrthographicCamera makeDefault position={[0, 10, 0]} zoom={22} />
				<MapControls enableRotate={false} enableDamping dampingFactor={0.1} minZoom={15} maxZoom={45} />
				<MapScene />
			</Canvas>
		</div>
	);
};
