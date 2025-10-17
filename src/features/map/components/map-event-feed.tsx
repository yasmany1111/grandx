import { BellDot, Swords, TrendingUp, Users } from 'lucide-react';

const EVENTS = [
	{
		id: 'evt-1',
		icon: Swords,
		title: 'Border tension escalating',
		description: 'Varenth Dominion mobilized the Ember Spine garrison.',
		tonality: 'warning',
	},
	{
		id: 'evt-2',
		icon: TrendingUp,
		title: 'Industrial investment',
		description: 'Albion approved machine tools subsidies for Lakeshire.',
		tonality: 'positive',
	},
	{
		id: 'evt-3',
		icon: Users,
		title: 'Migration wave',
		description: 'Karsan pastoralists seek settlement rights in Sunreach.',
		tonality: 'neutral',
	},
];

const toneClasses: Record<string, string> = {
	positive: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-200',
	neutral: 'border-slate-700 bg-slate-900/80 text-slate-200',
	warning: 'border-amber-500/30 bg-amber-500/10 text-amber-200',
};

export const MapEventFeed = () => (
	<section className="flex w-full max-w-4xl items-center gap-4 rounded-3xl border border-slate-800/70 bg-slate-950/85 px-5 py-3 shadow-lg shadow-slate-900/60 backdrop-blur">
		<div className="flex items-center gap-2 text-slate-400">
			<BellDot className="h-5 w-5" />
			<span className="text-xs font-semibold uppercase tracking-widest">Alerts</span>
		</div>
		<div className="flex flex-1 items-center gap-3 overflow-hidden">
			{EVENTS.map((event) => {
				const Icon = event.icon;
				return (
					<div
						key={event.id}
						className={`flex min-w-0 flex-1 items-center gap-3 rounded-2xl border px-4 py-2 text-sm shadow-inner ${
							toneClasses[event.tonality]
						}`}
					>
						<span className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-950/60">
							<Icon className="h-4 w-4" />
						</span>
						<div className="min-w-0">
							<p className="truncate font-medium">{event.title}</p>
							<p className="truncate text-xs text-slate-300/80">{event.description}</p>
						</div>
					</div>
				);
			})}
		</div>
	</section>
);
