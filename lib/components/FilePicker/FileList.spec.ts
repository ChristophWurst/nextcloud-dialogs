/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { mount, shallowMount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import FileList from './FileList.vue'
import { File, Folder } from '@nextcloud/files'
import { nextTick } from 'vue'

const axios = vi.hoisted(() => ({
	get: vi.fn(() => new Promise(() => {})),
}))
vi.mock('@nextcloud/axios', () => ({ default: axios }))

const exampleNodes = [
	new File({
		owner: null,
		source: 'http://example.com/dav/a-file.txt',
		mime: 'text/plain',
		mtime: new Date(),
		root: '/',
		size: 200,
	}),
	new File({
		owner: null,
		source: 'http://example.com/dav/favorite.txt',
		mime: 'text/plain',
		mtime: new Date(),
		root: '/',
		size: 321,
		attributes: {
			favorite: 1,
		},
	}),
	new Folder({
		owner: null,
		source: 'http://example.com/dav/directory',
		mtime: new Date(),
		root: '/',
		size: 0,
	}),
	new File({
		owner: null,
		source: 'http://example.com/dav/b-file.txt',
		mime: 'text/plain',
		mtime: new Date(),
		root: '/',
		size: 100,
	}),
]

describe('FilePicker FileList', () => {
	beforeAll(() => {
		vi.useFakeTimers()
	})

	it('is mountable', () => {
		const consoleError = vi.spyOn(console, 'error')
		const consoleWarning = vi.spyOn(console, 'warn')

		const wrapper = shallowMount(FileList, {
			props: {
				currentView: 'files',
				multiselect: false,
				allowPickDirectory: false,
				loading: false,
				files: [],
				selectedFiles: [],
				path: '/',
			},
		})
		expect(wrapper.html()).toBeTruthy()
		// No errors or warnings
		expect(consoleError).not.toBeCalled()
		expect(consoleWarning).not.toBeCalled()
	})

	it('header checkbox is not shown if multiselect is `false`', () => {
		const wrapper = shallowMount(FileList, {
			props: {
				currentView: 'files',
				multiselect: false,
				allowPickDirectory: false,
				loading: false,
				files: [],
				selectedFiles: [],
				path: '/',
			},
		})
		expect(wrapper.find('th.row-checkbox').exists()).toBe(false)
	})

	it('header checkbox is shown if multiselect is `true`', async () => {
		const wrapper = shallowMount(FileList, {
			props: {
				currentView: 'files',
				multiselect: true,
				allowPickDirectory: false,
				loading: false,
				files: [],
				selectedFiles: [],
				path: '/',
			},
		})

		await nextTick()

		const selectAll = wrapper.getComponent('[data-testid="select-all-checkbox"]')
		expect(selectAll.exists()).toBe(true)
		// there is an aria label
		expect(selectAll.props('ariaLabel')).toBeTruthy()
		// no checked
		expect(selectAll.props('modelValue')).toBe(false)
	})

	it('header checkbox is checked when all nodes are selected', async () => {
		const nodes = [...exampleNodes]
		const wrapper = shallowMount(FileList, {
			props: {
				currentView: 'files',
				multiselect: true,
				allowPickDirectory: false,
				loading: false,
				files: nodes,
				selectedFiles: nodes,
				path: '/',
			},
		})

		const selectAll = wrapper.getComponent('[data-testid="select-all-checkbox"]')
		expect(selectAll.props('modelValue')).toBe(true)
	})

	describe('file list sorting', () => {
		it('is sorted initially by name', async () => {
			const nodes = [...exampleNodes]
			const wrapper = mount(FileList, {
				props: {
					currentView: 'files',
					multiselect: true,
					allowPickDirectory: false,
					loading: false,
					files: nodes,
					selectedFiles: [],
					path: '/',
				},
				stubs: {
					FilePreview: true,
				},
			})

			await nextTick()

			const rows = wrapper.findAll('[data-testid="file-list-row"]')
			// all nodes are shown
			expect(rows.length).toBe(nodes.length)
			// by default favorites are sorted before other files
			expect(rows.at(0).attributes('data-filename')).toBe('favorite.txt')
			// folder are sorted first
			expect(rows.at(1).attributes('data-filename')).toBe('directory')
			// other files are ascending
			expect(rows.at(2).attributes('data-filename')).toBe('a-file.txt')
			expect(rows.at(3).attributes('data-filename')).toBe('b-file.txt')
		})

		it('can sort descending by name', async () => {
			const nodes = [...exampleNodes]
			const wrapper = mount(FileList, {
				props: {
					currentView: 'files',
					multiselect: true,
					allowPickDirectory: false,
					loading: false,
					files: nodes,
					selectedFiles: [],
					path: '/',
				},
				stubs: {
					FilePreview: true,
				},
			})

			await nextTick()

			wrapper.find('[data-test="file-picker_sort-name"]').trigger('click')

			await nextTick()

			const rows = wrapper.findAll('.file-picker__row')
			// all nodes are shown
			expect(rows.length).toBe(nodes.length)
			// by default favorites are sorted before other files
			expect(rows.at(0).attributes('data-filename')).toBe('favorite.txt')
			// folder are sorted first
			expect(rows.at(1).attributes('data-filename')).toBe('directory')
			// other files are descending
			expect(rows.at(2).attributes('data-filename')).toBe('b-file.txt')
			expect(rows.at(3).attributes('data-filename')).toBe('a-file.txt')
		})
	})
})
