import { Pause, Play, SkipForward, Zap } from 'lucide-react';

export const MapTopBar = () => {
	return (
		<header className="flex w-full items-center justify-between rounded-b-3xl border border-slate-800/70 bg-slate-950/85 px-6 py-4 shadow-lg shadow-slate-900/70 backdrop-blur">
			<div className="flex flex-1 items-center gap-6">
				<div className="flex flex-col">
					<span className="text-xs uppercase tracking-widest text-slate-500">
						Date
					</span>
					<p className="text-xl font-semibold text-slate-100">12 March 1852</p>
				</div>
				<div className="hidden flex-col sm:flex">
					<span className="text-xs uppercase tracking-widest text-slate-500">
						Era Objectives
					</span>
					<p className="text-sm text-slate-300">
						Industrialize the heartlands · Secure northern sea lanes
					</p>
				</div>
			</div>
			<div className="flex items-center gap-3">
				<button
					type="button"
					className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/60 bg-slate-900/60 text-slate-300 transition hover:border-sky-600/60 hover:bg-slate-900/90 hover:text-sky-200"
				>
					<Play className="h-5 w-5" />
				</button>
				<button
					type="button"
					className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/60 bg-slate-900/60 text-slate-300 transition hover:border-sky-600/60 hover:bg-slate-900/90 hover:text-sky-200"
				>
					<Pause className="h-5 w-5" />
				</button>
				<button
					type="button"
					className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-800/60 bg-slate-900/60 text-slate-300 transition hover:border-sky-600/60 hover:bg-slate-900/90 hover:text-sky-200"
				>
					<SkipForward className="h-5 w-5" />
				</button>
				<button
					type="button"
					className="flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/20 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-amber-100 shadow shadow-amber-900/40"
				>
					<Zap className="h-4 w-4" />
					War Preparation
				</button>
			</div>
		</header>
	);
};
