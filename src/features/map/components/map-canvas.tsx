import { useCallback, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, MapControls, OrthographicCamera } from '@react-three/drei';
import { Color, LineBasicMaterial, MeshStandardMaterial } from 'three';

import { MOCK_MAP_DATA } from '../data/mock-world';
import { useMapInteraction } from '../hooks/use-map-interaction';
import { getProvinceFill, getBorderColor } from '../lib/map-colors';
import { useProvinceGeometry } from '../lib/province-geometry';
import { MAP_HEIGHT, MAP_WIDTH } from '../lib/map-constants';
import type { Province } from '../types';

const useProvinceMaterial = (color: string, intensity: number) =>
	useMemo(() => {
		const instance = new MeshStandardMaterial({
			color,
			emissive: new Color(color).multiplyScalar(intensity * 0.25),
			emissiveIntensity: intensity,
			metalness: 0.14,
			roughness: 0.55,
			polygonOffset: true,
			polygonOffsetFactor: -1.8,
		});
		return instance;
	}, [color, intensity]);

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
	const material = useProvinceMaterial(fill, isSelected ? 1.45 : isHovered ? 1.1 : 0.75);
	const outlineMaterial = useMemo(
		() =>
			new LineBasicMaterial({
				color: isSelected ? '#e2e8f0' : isHovered ? '#cbd5f5' : '#0f172a',
				linewidth: 1.4,
			}),
		[isHovered, isSelected],
	);
	const { geometry, edges, centroid } = useProvinceGeometry(province);

	useEffect(() => () => material.dispose(), [material]);
	useEffect(() => () => outlineMaterial.dispose(), [outlineMaterial]);

	const handlePointerOver = useCallback(() => setHoveredProvince(province.id), [province.id, setHoveredProvince]);
	const handlePointerOut = useCallback(() => setHoveredProvince(null), [setHoveredProvince]);
	const handleClick = useCallback(() => setSelectedProvince(province.id), [province.id, setSelectedProvince]);

	return (
		<group position={centroid}>
			<mesh
				onPointerOver={handlePointerOver}
				onPointerOut={handlePointerOut}
				onClick={handleClick}
				material={material}
				geometry={geometry}
				castShadow
				receiveShadow
			/>
			{isSelected ? (
				<mesh geometry={geometry} position={[0, 0.04, 0]}>
					<meshStandardMaterial color="#f8fafc" transparent opacity={0.1} />
				</mesh>
			) : null}
			<lineSegments geometry={edges} position={[0, 0.028, 0]}>
				<primitive object={outlineMaterial} attach="material" />
			</lineSegments>
		</group>
	);
};

const WaterSurface = () => {
	const material = useMemo(
		() =>
			new MeshStandardMaterial({
				color: '#0c1936',
				metalness: 0.6,
				roughness: 0.35,
				envMapIntensity: 0.7,
				transparent: true,
				opacity: 0.92,
			}),
		[],
	);
	useEffect(() => () => material.dispose(), [material]);
	const deepTone = useMemo(() => new Color('#081222'), []);
	const shallowTone = useMemo(() => new Color('#1f3e6b'), []);

	useFrame(({ clock }) => {
		const time = clock.getElapsedTime();
		const tint = 0.52 + Math.sin(time * 0.18) * 0.04;
		material.color.lerpColors(deepTone, shallowTone, tint);
	});

	return (
		<mesh position={[0, -0.08, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[MAP_WIDTH * 1.4, MAP_HEIGHT * 1.6, 96, 96]} />
			<primitive object={material} attach="material" />
		</mesh>
	);
};

const SceneBackdrop = () => {
	const { mapMode } = useMapInteraction();
	const tone = getBorderColor(mapMode);
	return (
		<mesh position={[0, -0.18, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
			<planeGeometry args={[MAP_WIDTH * 1.7, MAP_HEIGHT * 1.9, 1, 1]} />
			<meshStandardMaterial color={tone} metalness={0.08} roughness={0.92} />
		</mesh>
	);
};

const MapScene = () => {
	const { mapMode } = useMapInteraction();
	const borderColor = getBorderColor(mapMode);

	return (
		<group>
			<ambientLight intensity={0.82} />
			<directionalLight color="#f1e6d2" position={[18, 24, 12]} intensity={1.15} castShadow />
			<directionalLight color="#7aa8ff" position={[-14, 16, 20]} intensity={0.42} />
			<SceneBackdrop />
			<WaterSurface />
			{MOCK_MAP_DATA.provinces.map((province) => (
				<ProvinceMesh key={province.id} province={province} />
			))}
			<mesh position={[0, -0.14, 0]} rotation={[-Math.PI / 2, 0, 0]}>
				<planeGeometry args={[MAP_WIDTH * 1.25, MAP_HEIGHT * 1.4]} />
				<meshBasicMaterial color={borderColor} wireframe opacity={0.18} transparent />
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
				<fog attach="fog" args={[new Color('#05070e'), 14, 40]} />
				<OrthographicCamera makeDefault position={[0, 14, 10]} zoom={22} />
				<MapControls
					enableRotate={false}
					enableDamping
					dampingFactor={0.18}
					zoomToCursor
					target={[0, 0, 0]}
					minZoom={16}
					maxZoom={38}
				/>
				<MapScene />
			</Canvas>
		</div>
	);
};

