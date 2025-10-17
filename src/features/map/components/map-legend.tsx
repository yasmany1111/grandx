import { MAP_MODES } from '../data/mockWorld';
import { useMapInteraction } from '../hooks/use-map-interaction';

const MODE_NOTES: Record<string, string[]> = {
	political: [
		'Owner colors with subtle glow indicate diplomatic weight.',
		'Borders intensify where war goals are active.',
	],
	terrain: [
		'Gradient shading conveys elevation and travel cost.',
		'Impassable ridges glow with icy highlights at max zoom.',
	],
	supply: [
		'Blue saturation encodes local supply throughput.',
		'Railway overlays unlock when technologies are researched.',
	],
	development: [
		'Warm luminance marks investment tiers from nascent to metropolis.',
		'Construction queue overlays pulse while building.',
	],
	diplomacy: [
		'Green and crimson rings reflect opinion ranges.',
		'Claimant banners appear where overlapping cores exist.',
	],
};

export const MapLegend = () => {
	const { mapMode } = useMapInteraction();
	const activeMode = MAP_MODES.find((mode) => mode.id === mapMode) ?? MAP_MODES[0];
	const notes = MODE_NOTES[mapMode] ?? [];

	return (
		<aside className="w-72 rounded-3xl border border-slate-800/70 bg-slate-950/85 p-5 text-sm text-slate-200 shadow-lg shadow-slate-900/60 backdrop-blur">
			<div className="flex items-center justify-between">
				<div>
					<p className="text-xs uppercase tracking-widest text-slate-500">Map Mode</p>
					<h3 className="text-lg font-semibold text-slate-100">{activeMode.label}</h3>
				</div>
				<span className="rounded-full border border-slate-800/60 bg-slate-900/70 px-3 py-1 text-xs uppercase tracking-widest text-slate-400">
					Concept
				</span>
			</div>
			<p className="mt-3 text-xs text-slate-400">{activeMode.description}</p>
			<ul className="mt-4 space-y-2 text-xs text-slate-300">
				{notes.map((note) => (
					<li key={note} className="rounded-2xl border border-slate-900/70 bg-slate-900/60 p-2">
						• {note}
					</li>
				))}
			</ul>
		</aside>
	);
};
