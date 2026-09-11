import { sveltekit } from '@sveltejs/kit/vite';
import stylex from '@stylexjs/unplugin';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit(),
		{
			...stylex.vite({
				useCSSLayers: true,
				enableFontSizePxToRem: true
			}),
			// The StyleX plugin defaults to enforce: 'pre', which would run it
			// before the Svelte compiler. Reset it so sveltekit() transforms
			// .svelte files first.
			enforce: undefined
		}
	]
});
