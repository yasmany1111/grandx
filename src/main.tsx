import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AppRoot } from './app-root';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<AppRoot />
	</StrictMode>,
);
