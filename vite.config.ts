import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	// Пре-бандлим зависимости сразу при старте, чтобы Vite не делал повторную
	// оптимизацию и перезагрузку посреди работы (главный виновник тормозов — lucide-svelte:
	// каждая иконка = отдельный модуль, иначе они до-обнаруживаются лениво).
	optimizeDeps: {
		include: ['lucide-svelte', 'clsx', 'tailwind-merge', 'tailwind-variants', 'qrcode', 'zod']
	},
	// Прогрев горячих файлов при старте dev-сервера — убирает паузу на первой навигации.
	server: {
		warmup: {
			clientFiles: [
				'./src/routes/**/+layout.svelte',
				'./src/routes/**/+page.svelte',
				'./src/lib/components/**/*.svelte'
			]
		}
	}
});
