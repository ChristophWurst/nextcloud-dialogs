/**
 * @copyright Copyright (c) 2023 Ferdinand Thiessen <opensource@fthiessen.de>
 *
 * @author Ferdinand Thiessen <opensource@fthiessen.de>
 *
 * @license AGPL-3.0-or-later
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as
 * published by the Free Software Foundation, either version 3 of the
 * License, or (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */
import type { Component } from 'vue'

import { createApp, h, toRaw } from 'vue'

/**
 * Helper to spawn a Vue dialog without having to mount it from a component
 *
 * @param dialog The dialog component to spawn
 * @param props Properties to pass to the dialog
 * @param onClose Callback when the dialog is closed
 */
export const spawnDialog = (dialog: Component, props: any, onClose: (...rest: unknown[]) => void = () => {}): Vue => {
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
	vue.mount(el)
}
