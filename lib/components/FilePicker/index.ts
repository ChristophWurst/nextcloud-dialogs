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

import type { Component } from 'vue'
import type { DefaultComputed, DefaultData, DefaultMethods } from 'vue/types/options.js'
import { defineAsyncComponent } from 'vue'

type IFilePickerProps = (typeof import ('./FilePicker.vue').default)['props']

// Async import for module splitting (treeshaking)
/**
 * FilePicker Vue component (implemented as async component)
 * @example
 * ```vue
 * <template>
 *   <FilePicker name="Select a file" :buttons="buttons" />
 * </template>
 * <script setup lang="ts">
 *   import { FilePickerVue as FilePicker, type IFilePickerButton } from '@nextcloud/dialogs'
 *   const buttons: IFilePickerButton[] = [{
 *     label: 'Pick',
 *     callback: (nodes) => console.log('Picked', nodes)
 *   }]
 * </script>
 */
export const FilePickerVue = defineAsyncComponent(() => import('./FilePicker.vue')) as Component<DefaultData<never>, DefaultMethods<never>, DefaultComputed, IFilePickerProps>
