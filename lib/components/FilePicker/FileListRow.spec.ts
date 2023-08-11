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

import { afterEach, describe, expect, it, vi } from 'vitest'
import { File } from '@nextcloud/files'
import { shallowMount } from '@vue/test-utils'

import FileListRow from './FileListRow.vue'

describe('FilePicker: FileListRow', () => {
	const node = new File({
		owner: null,
		mtime: new Date(),
		mime: 'text/plain',
		source: 'https://example.com/dav/a.txt',
		root: '/',
		attributes: { displayName: 'test' },
	})

	afterEach(() => {
		vi.restoreAllMocks()
	})

	it('is shallowMountable', () => {
		const consoleWarn = vi.spyOn(console, 'warn')
		const consoleError = vi.spyOn(console, 'error')

		const wrapper = shallowMount(FileListRow, {
			props: {
				allowPickDirectory: true,
				selected: false,
				showCheckbox: true,
				canPick: true,
				node,
				cropImagePreviews: true,
			},
		})

		// No console errors
		expect(consoleWarn).not.toBeCalled()
		expect(consoleError).not.toBeCalled()
		// shallowMounted
		expect(wrapper.exists()).toBe(true)
		expect(wrapper.element.tagName.toLowerCase()).toBe('tr')
		expect(wrapper.find('[data-testid="file-list-row"]').isEmpty()).toBe(false)
	})

	it('shows checkbox based on `showCheckbox` property', async () => {
		const wrapper = shallowMount(FileListRow, {
			props: {
				allowPickDirectory: true,
				selected: false,
				showCheckbox: true,
				canPick: true,
				node,
				cropImagePreviews: true,
			},
		})

		expect(wrapper.find('[data-testid="row-checkbox"]').exists()).toBe(true)
		await wrapper.setProps({ showCheckbox: false })
		expect(wrapper.find('[data-testid="row-checkbox"]').exists()).toBe(false)
	})

	it('Click checkbox triggers select', async () => {
		const wrapper = shallowMount(FileListRow, {
			props: {
				allowPickDirectory: false,
				selected: false,
				showCheckbox: true,
				canPick: true,
				node,
				cropImagePreviews: true,
			},
			global: {
				stubs: {
					NcCheckboxRadioSwitch: {
						template: '<label><input type="checkbox" @click="$emit(\'update:modelValue\', true)" ></label>',
					},
				},
			},
		})

		await wrapper.find('input[type="checkbox"]').trigger('click')

		// one event with payload `true` is expected
		expect(wrapper.emitted('update:selected')).toEqual([[true]])
	})

	it('Click element triggers select', async () => {
		const wrapper = shallowMount(FileListRow, {
			props: {
				allowPickDirectory: false,
				selected: false,
				showCheckbox: true,
				canPick: true,
				node,
				cropImagePreviews: true,
			},
		})

		await wrapper.find('[data-testid="row-name"]').trigger('click')

		// one event with payload `true` is expected
		expect(wrapper.emitted('update:selected')).toEqual([[true]])
	})

	it('Click element without checkbox triggers select', async () => {
		const wrapper = shallowMount(FileListRow, {
			props: {
				allowPickDirectory: false,
				selected: false,
				showCheckbox: false,
				canPick: true,
				node,
				cropImagePreviews: true,
			},
		})

		await wrapper.find('[data-testid="row-name"]').trigger('click')

		// one event with payload `true` is expected
		expect(wrapper.emitted('update:selected')).toEqual([[true]])
	})

	it('Enter triggers select', async () => {
		const wrapper = shallowMount(FileListRow, {
			props: {
				allowPickDirectory: false,
				selected: false,
				showCheckbox: false,
				canPick: true,
				node,
				cropImagePreviews: true,
			},
		})

		await wrapper.trigger('keydown', { key: 'Enter', bubbles: true })

		expect(wrapper.emitted('update:selected')).toEqual([[true]])
	})
})
