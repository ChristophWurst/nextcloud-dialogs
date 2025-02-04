/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
import type { App, Component } from 'vue'

import { createApp, h, toRaw } from 'vue'

/**
 * Helper to spawn a Vue dialog without having to mount it from a component
 *
 * @param dialog The dialog component to spawn
 * @param props Properties to pass to the dialog
 * @param onClose Callback when the dialog is closed
 */
export const spawnDialog = (dialog: Component, props: any, onClose: (...rest: unknown[]) => void = () => {}): App => {
	const el = document.createElement('div')

	const container: HTMLElement = document.querySelector(props?.container) || document.body
	container.appendChild(el)

	const vue = createApp({
		name: 'VueDialogHelper',
		render: () =>
			h(dialog, {
				props,
				onClose: (...rest: unknown[]) => {
					onClose(...rest.map(v => toRaw(v)))
					vue.unmount()
				},
			}),
	})
	return vue
}
