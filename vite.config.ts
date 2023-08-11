import { createLibConfig } from '@nextcloud/vite-config'
import { readdirSync, readFileSync } from 'fs'
import { po as poParser } from 'gettext-parser'
import { defineConfig, type UserConfigFn } from 'vite'

const translations = readdirSync('./l10n')
	.filter(name => name !== 'messages.pot' && name.endsWith('.pot'))
	.map(file => {
		const path = './l10n/' + file
		const locale = file.slice(0, -'.pot'.length)

		const po = readFileSync(path)
		const json = poParser.parse(po)
		return {
			locale,
			json,
		}
	})

export default defineConfig((env) => {
	return createLibConfig({
		index: 'lib/index.ts',
		filepicker: 'lib/filepicker.ts',
	}, {
		config: {
			build: {
				// Fix for vite config, TODO: remove with next release
				cssCodeSplit: false,
			},
			// vitest configuration
			test: {
				environment: 'happy-dom',
				coverage: {
					all: true,
					provider: 'v8',
					include: ['lib/**/*.ts', 'lib/*.ts'],
					exclude: ['lib/**/*.spec.ts'],
				},
				css: {
					modules: {
						classNameStrategy: 'non-scoped',
					},
				},
				server: {
					deps: {
						inline: [
							/@nextcloud\/vue/, // Fix unresolvable .css extension for ssr
							/@nextcloud\/files/, // Fix CommonJS cancelable-promise not supporting named exports
						],
					},
				},
			},
		},
		// We build for ESM and legacy common js
		libraryFormats: ['es', 'cjs'],
		// We want one single output CSS file
		inlineCSS: false,
		// Packages that should be externalized or bundled
		nodeExternalsOptions: {
			// for subpath imports like '@nextcloud/l10n/gettext'
			include: [/^@nextcloud\//],
			exclude: [
				// we should not rely on external vue SFC dependencies thus bundle all .vue files
				/^vue-material-design-icons\//,
				/\.vue(\?|$)/,
				// and bundle raw data, e.g., raw SVGs
				/\?raw$/,
			],
		},
		// Inject our translations
		replace: {
			__TRANSLATIONS__: JSON.stringify(translations),
		},
		// Rollup our type definitions to only publish what it needed
		DTSPluginOptions: {
			rollupTypes: false, // env.mode === 'production',
		},
	})(env)
}) as UserConfigFn
