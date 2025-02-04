/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterEach, describe, expect, it, vi } from 'vitest'
import { File } from '@nextcloud/files'
import { shallowMount } from '@vue/test-utils'

import FileListRow from './FileListRow.vue'
import { nextTick } from 'vue'

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

		wrapper.element.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, key: 'Enter' }))
		await nextTick()

		expect(wrapper.emitted('update:selected')).toEqual([[true]])
	})
})
