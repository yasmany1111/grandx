declare module 'world-geojson' {
	import type { FeatureCollection, GeoJsonObject, Geometry } from 'geojson';

	interface CountrySelector {
		countryName: string;
		stateName?: string;
		areaName?: string;
	}

	export function forCountry(name: string): FeatureCollection;
	export function forState(countryName: string, stateName: string): FeatureCollection;
	export function forArea(countryName: string, areaName: string): FeatureCollection;
	export function combineGeoJson(selectors: CountrySelector[]): FeatureCollection<Geometry>;
	const all: Record<string, GeoJsonObject>;
	export default all;
}

