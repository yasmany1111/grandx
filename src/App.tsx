import { useState } from 'react';
import { Button } from '@/components/ui/button';

function App() {
	const [count, setCount] = useState(0);

	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 text-slate-50">
			<div className="mx-auto w-full max-w-lg space-y-6 rounded-3xl border border-slate-800 bg-slate-900/70 p-8 shadow-2xl">
				<h1 className="text-center text-3xl font-semibold tracking-tight">
					Vite + Tailwind CSS
				</h1>

				<p className="text-center text-sm text-slate-300">
					Tailwind v4 is now wired up. Use utility classes to build interfaces
					fast, or scaffold components with shadcn/ui.
				</p>

				<div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-6 text-center shadow-inner">
					<p className="mb-4 text-lg font-medium">
						Button clicks so far:
						<span className="ml-2 inline-flex h-9 min-w-9 items-center justify-center rounded-full bg-slate-100 px-4 text-base font-semibold text-slate-900">
							{count}
						</span>
					</p>
					<Button
						className="rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 px-6 py-2 text-white shadow-lg transition hover:from-sky-400 hover:to-indigo-400 focus-visible:ring-sky-500/30"
						onClick={() => setCount((value) => value + 1)}
					>
						Increment
					</Button>
				</div>
			</div>
		</main>
	);
}

export default App;
