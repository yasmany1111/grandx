import type { GeoJsonObject } from 'geojson';
import { latLngBounds, type Path, type PathOptions } from 'leaflet';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { GeoJSON, MapContainer } from 'react-leaflet';

import { MOCK_MAP_DATA } from '../data/mock-world';
import { useMapInteraction } from '../hooks/use-map-interaction';
import { getBorderColor, getProvinceFill } from '../lib/map-colors';
import {
	buildProvinceFeatureCollection,
	type ProvinceFeatureCollection,
} from '../lib/province-geojson';

interface ProvinceGeoLayerProps {
	featureCollection: ProvinceFeatureCollection;
}

const ProvinceGeoLayer = ({ featureCollection }: ProvinceGeoLayerProps) => {
	const {
		mapMode,
		hoveredProvinceId,
		selectedProvinceId,
		setHoveredProvince,
		setSelectedProvince,
	} = useMapInteraction();

	const provinceById = useMemo(
		() =>
			new Map(
				MOCK_MAP_DATA.provinces.map((province) => [province.id, province]),
			),
		[],
	);
	const countriesByTag = useMemo(
		() =>
			new Map(MOCK_MAP_DATA.countries.map((country) => [country.tag, country])),
		[],
	);

	const layersRef = useRef(new Map<string, Path>());

	const applyLayerStyle = useCallback(
		(provinceId: string, layer: Path) => {
			const province = provinceById.get(provinceId);
			if (!province) {
				return;
			}
			const owner = countriesByTag.get(province.ownerTag);
			const isSelected = selectedProvinceId === province.id;
			const isHovered = hoveredProvinceId === province.id;
			const fill = getProvinceFill(province, mapMode, owner);
			const style: PathOptions = {
				color: isSelected ? '#f8fafc' : '#111827',
				weight: isSelected ? 2.5 : 1.1,
				fillColor: fill,
				fillOpacity: isSelected ? 0.82 : isHovered ? 0.7 : 0.55,
				opacity: isSelected ? 0.95 : 0.65,
				className: 'province-shape',
			};
			layer.setStyle(style);
			if (isSelected && 'bringToFront' in layer) {
				layer.bringToFront();
			}
		},
		[
			mapMode,
			hoveredProvinceId,
			selectedProvinceId,
			countriesByTag,
			provinceById,
		],
	);

	useEffect(() => {
		for (const [provinceId, layer] of layersRef.current.entries()) {
			applyLayerStyle(provinceId, layer);
		}
	}, [applyLayerStyle]);

	return (
		<GeoJSON
			data={featureCollection as GeoJsonObject}
			style={() => ({ color: '#111827', weight: 1 })}
			smoothFactor={0.5}
			onEachFeature={(feature, layer) => {
				const properties = feature.properties as
					| { provinceId?: string }
					| undefined;
				const provinceId = properties?.provinceId;
				if (!provinceId) {
					return;
				}
				const pathLayer = layer as Path;
				layersRef.current.set(provinceId, pathLayer);
				applyLayerStyle(provinceId, pathLayer);
				layer.on({
					mouseover: () => {
						setHoveredProvince(provinceId);
					},
					mouseout: () => {
						setHoveredProvince(null);
					},
					click: () => {
						setSelectedProvince(provinceId);
					},
				});
			}}
		/>
	);
};

const getFeatureCollectionBounds = (
	featureCollection: ProvinceFeatureCollection,
) => {
	let minLat = Infinity;
	let minLng = Infinity;
	let maxLat = -Infinity;
	let maxLng = -Infinity;

	const register = (lng: number, lat: number) => {
		if (lat < minLat) minLat = lat;
		if (lat > maxLat) maxLat = lat;
		if (lng < minLng) minLng = lng;
		if (lng > maxLng) maxLng = lng;
	};

	for (const feature of featureCollection.features) {
		const geometry = feature.geometry;
		if (!geometry) {
			continue;
		}
		if (geometry.type === 'Polygon') {
			for (const ring of geometry.coordinates) {
				for (const [lng, lat] of ring) {
					register(lng, lat);
				}
			}
		}
		if (geometry.type === 'MultiPolygon') {
			for (const polygon of geometry.coordinates) {
				for (const ring of polygon) {
					for (const [lng, lat] of ring) {
						register(lng, lat);
					}
				}
			}
		}
	}
	if (
		minLat === Infinity ||
		minLng === Infinity ||
		maxLat === -Infinity ||
		maxLng === -Infinity
	) {
		return latLngBounds([0, 0], [0, 0]);
	}
	return latLngBounds([minLat, minLng], [maxLat, maxLng]).pad(0.2);
};

export const MapCanvas = () => {
	const { mapMode } = useMapInteraction();
	const borderColor = getBorderColor(mapMode);
	const featureCollection = useMemo(
		() => buildProvinceFeatureCollection(MOCK_MAP_DATA),
		[],
	);
	const bounds = useMemo(
		() => getFeatureCollectionBounds(featureCollection),
		[featureCollection],
	);

	return (
		<div className="relative h-full w-full">
			<div className="map-gradient-overlay absolute inset-0" aria-hidden />
			<div
				className="absolute inset-0 bg-gradient-to-br from-slate-950/70 via-slate-950/20 to-slate-950/80"
				aria-hidden
			/>
			<MapContainer
				bounds={bounds}
				boundsOptions={{ padding: [40, 40] }}
				minZoom={3}
				maxZoom={7}
				zoomSnap={0.5}
				zoomControl={false}
				scrollWheelZoom
				doubleClickZoom={false}
				attributionControl={false}
				className="relative z-10 h-full w-full rounded-[2.5rem]"
				preferCanvas
			>
				<ProvinceGeoLayer featureCollection={featureCollection} />
			</MapContainer>
			<div
				className="pointer-events-none absolute inset-0 rounded-[2.5rem] border border-slate-900/40"
				style={{ boxShadow: `0 0 120px 20px ${borderColor}1c inset` }}
			/>
		</div>
	);
};
