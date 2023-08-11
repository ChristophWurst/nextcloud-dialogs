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
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 *
 */

import type { Node } from '@nextcloud/files'

export type ISeverity = 'info' | 'warning' | 'error'

/**
 * Interface for defining buttons passed to the Dialog component
 * See NcDialogButton
 */
export interface IDialogButton {
	/** Label of the button */
	label: string,

	/** Callback on button click */
	callback: () => void,

	/**
	 * Optional Icon for the button
	 * Should be a SVG image as raw string
	 */
	icon?: string,

	/**
	 * Button type
	 * @see https://nextcloud-vue-components.netlify.app/#/Components/NcButton
	 */
	type?: 'primary' | 'secondary' | 'error' | 'warning' | 'success'
}

/**
 * Interface to define buttons of the FilePicker component
 * The buttons are based on the Dialog buttons but the callback gets the array of selected nodes
 */
export interface IFilePickerButton extends Omit<IDialogButton, 'callback'> {
	/**
	 * Callback on button click
	 *
	 * @param nodes Array of `@nextcloud/files` Nodes that were selected
	 */
	callback: (nodes: Node[]) => void
}

export type IFilePickerButtonFactory = (selectedNodes: Node[], currentPath: string, currentView: string) => IFilePickerButton[]

/**
 * Type of filter functions to filter the FilePicker's file list
 */
export type IFilePickerFilter = (node: Node) => boolean
