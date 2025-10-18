import { useEffect, useRef, useState } from 'react';
import Globe from 'react-globe.gl';
import { useHexMapInteraction } from '../hooks/use-hex-map-interaction';

interface CountryFeature {
	type: string;
	properties: {
		ADMIN: string;
		ISO_A2: string;
		POP_EST: number;
		GDP_MD_EST: number;
		CONTINENT: string;
	};
	geometry: {
		type: string;
		coordinates: number[][][] | number[][][][];
	};
}

interface GeoJsonData {
	type: string;
	features: CountryFeature[];
}

export const D3HexMap = () => {
	const globeRef = useRef();
	const {
		mapMode,
		hoveredTileId,
		selectedTileId,
		setHoveredTile,
		setSelectedTile,
	} = useHexMapInteraction();
	const [countries, setCountries] = useState<CountryFeature[]>([]);

	useEffect(() => {
		// Fetch GeoJSON data
		fetch('/src/assets/datasets/baisc.geojson')
			.then((res) => res.json())
			.then((data: GeoJsonData) => {
				setCountries(data.features);
			})
			.catch((error) => {
				console.error('Error loading GeoJSON:', error);
			});
	}, []);

	return (
		<div className="h-full w-full">
			<Globe
				ref={globeRef}
				backgroundColor="#0a0f1e"
				globeImageUrl="/src/assets/datasets/earth-dark.jpg"
				showAtmosphere={true}
				atmosphereColor="#4f7cff"
				atmosphereAltitude={0.2}
				hexPolygonsData={countries}
				hexPolygonResolution={3}
				hexPolygonMargin={0.3}
				hexPolygonUseDots={false}
				hexPolygonColor={(d: CountryFeature) => {
					const countryId = d.properties.ISO_A2;
					if (countryId === selectedTileId) {
						return '#ffffff'; // White for selected
					}
					if (countryId === hoveredTileId) {
						return '#fbbf24'; // Amber for hovered
					}
					return getHexColor(mapMode, d.properties.ADMIN);
				}}
				hexPolygonAltitude={(d: CountryFeature) => {
					const countryId = d.properties.ISO_A2;
					if (countryId === selectedTileId) {
						return 0.015; // Elevated for selected
					}
					return 0.006; // Default altitude
				}}
				hexPolygonLabel={(d: CountryFeature) => {
					const props = d.properties;
					return `
						<div style="padding: 12px; background: rgba(0,0,0,0.9); border-radius: 6px; min-width: 200px;">
							<div style="font-weight: bold; font-size: 16px; color: #fff; margin-bottom: 8px;">
								${props.ADMIN} (${props.ISO_A2})
							</div>
							<div style="color: #94a3b8; margin-bottom: 4px;">
								Population: <span style="color: #fff;">${props.POP_EST?.toLocaleString() || 'N/A'}</span>
							</div>
							<div style="color: #94a3b8; margin-bottom: 4px;">
								GDP: <span style="color: #fff;">$${props.GDP_MD_EST?.toLocaleString() || 'N/A'}M</span>
							</div>
							<div style="color: #94a3b8;">
								Continent: <span style="color: #fff;">${props.CONTINENT || 'N/A'}</span>
							</div>
						</div>
					`;
				}}
				onHexPolygonClick={(polygon: CountryFeature) => {
					const countryId = polygon.properties.ISO_A2;
					setSelectedTile(selectedTileId === countryId ? null : countryId);
				}}
				onHexPolygonHover={(polygon: CountryFeature | null) => {
					setHoveredTile(polygon ? polygon.properties.ISO_A2 : null);
				}}
			/>
		</div>
	);
};

// Generate consistent color from string (country name)
const stringToColor = (str: string): string => {
	let hash = 0;
	for (let i = 0; i < str.length; i++) {
		hash = str.charCodeAt(i) + ((hash << 5) - hash);
	}
	const color = Math.abs(hash).toString(16).substring(0, 6).padStart(6, '0');
	return `#${color}`;
};

// Helper function to get hex color based on map mode
const getHexColor = (mapMode: string, countryName?: string): string => {
	switch (mapMode) {
		case 'terrain':
			// Consistent color based on country name
			return countryName ? stringToColor(countryName) : '#475569';
		case 'political':
			return '#6366f1'; // Indigo
		case 'supply':
			return '#0891b2'; // Cyan
		case 'development':
			return '#a855f7'; // Purple
		case 'diplomacy':
			return '#ec4899'; // Pink
		default:
			return countryName ? stringToColor(countryName) : '#475569';
	}
};
