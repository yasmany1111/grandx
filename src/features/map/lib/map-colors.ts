import { MOCK_RELATIONS } from '../data/mock-world';
import type { Country, MapMode, Province } from '../types';

const TERRAIN_COLORS: Record<Province['terrain'], string> = {
	coast: '#3a8fb7',
	desert: '#d7a15d',
	forest: '#3c6f59',
	mountain: '#8f92a6',
	plains: '#8ba855',
};

const interpolate = (value: number, min: number, max: number): number => {
	const clamped = Math.min(Math.max(value, min), max);
	return (clamped - min) / (max - min || 1);
};

const lerpColorChannel = (start: number, end: number, t: number): number => start + (end - start) * t;

const hexToRgb = (hex: string): [number, number, number] => {
	const normalized = hex.replace('#', '');
	return [
		parseInt(normalized.slice(0, 2), 16),
		parseInt(normalized.slice(2, 4), 16),
		parseInt(normalized.slice(4, 6), 16),
	];
};

const rgbToHex = (r: number, g: number, b: number): string =>
	`#${[r, g, b]
		.map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
		.join('')}`;

const lerpHex = (start: string, end: string, t: number): string => {
	const [sr, sg, sb] = hexToRgb(start);
	const [er, eg, eb] = hexToRgb(end);
	return rgbToHex(
		lerpColorChannel(sr, er, t),
		lerpColorChannel(sg, eg, t),
		lerpColorChannel(sb, eb, t),
	);
};

const diplomaticPalette = {
	positive: '#59c08d',
	neutral: '#d1c284',
	negative: '#f26d6d',
};

const diplomaticScale = (value: number): string => {
	if (value >= 50) {
		return lerpHex(diplomaticPalette.neutral, diplomaticPalette.positive, interpolate(value, 50, 100));
	}
	if (value <= -50) {
		return lerpHex(diplomaticPalette.neutral, diplomaticPalette.negative, interpolate(Math.abs(value), 50, 100));
	}
	return diplomaticPalette.neutral;
};

export const getProvinceFill = (
	province: Province,
	mapMode: MapMode,
	country: Country | undefined,
): string => {
	switch (mapMode) {
		case 'political':
			return country?.color ?? '#888888';
	case 'terrain':
		return TERRAIN_COLORS[province.terrain];
	case 'supply': {
			const value = province.supplyLimit;
			return lerpHex('#2f3f70', '#7bc4ff', interpolate(value, 6, 30));
		}
	case 'development': {
			const value = province.development;
			return lerpHex('#282644', '#ffdd7f', interpolate(value, 20, 90));
		}
	case 'diplomacy': {
			const stance = province.ownerTag;
				const opinion = MOCK_RELATIONS[stance] ?? 0;
				return diplomaticScale(opinion);
			}
		default:
			return '#555555';
	}
};

export const getBorderColor = (mapMode: MapMode): string => {
	switch (mapMode) {
		case 'political':
			return '#0b1120';
		case 'terrain':
			return '#1d2a19';
		case 'supply':
			return '#1d253f';
		case 'development':
			return '#2c2620';
		case 'diplomacy':
			return '#1f1a27';
	}
};
