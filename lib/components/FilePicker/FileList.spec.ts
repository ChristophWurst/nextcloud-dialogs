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

import { mount } from '@vue/test-utils'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import FileList from './FileList.vue'
import { File, Folder } from '@nextcloud/files'

const axios = vi.hoisted(() => ({
	get: vi.fn(() => new Promise(() => {})),
}))
vi.mock('axios', () => axios)

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
			favorite: true,
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

		const wrapper = mount(FileList, {
			propsData: {
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
		const wrapper = mount(FileList, {
			propsData: {
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

	it('header checkbox is shown if multiselect is `true`', () => {
		const wrapper = mount(FileList, {
			propsData: {
				currentView: 'files',
				multiselect: true,
				allowPickDirectory: false,
				loading: false,
				files: [],
				selectedFiles: [],
				path: '/',
			},
		})
		const selectAll = wrapper.find('[data-testid="select-all-checkbox"]')
		expect(selectAll.exists()).toBe(true)
		// there is an aria label
		expect(selectAll.attributes('aria-label')).toBeTruthy()
		// no checked
		expect(selectAll.props('checked')).toBe(false)
	})

	it('header checkbox is checked when all nodes are selected', async () => {
		const nodes = [...exampleNodes]
		const wrapper = mount(FileList, {
			propsData: {
				currentView: 'files',
				multiselect: true,
				allowPickDirectory: false,
				loading: false,
				files: nodes,
				selectedFiles: nodes,
				path: '/',
			},
		})

		const selectAll = wrapper.find('[data-testid="select-all-checkbox"]')
		expect(selectAll.props('checked')).toBe(true)
	})

	describe('file list sorting', () => {
		it('is sorted initially by name', async () => {
			const nodes = [...exampleNodes]
			const wrapper = mount(FileList, {
				propsData: {
					currentView: 'files',
					multiselect: true,
					allowPickDirectory: false,
					loading: false,
					files: nodes,
					selectedFiles: [],
					path: '/',
				},
			})

			const rows = wrapper.findAll('[data-testid="file-list-row"]')
			// all nodes are shown
			expect(rows.length).toBe(nodes.length)
			// folder are sorted first
			expect(rows.at(0).attributes('data-filename')).toBe('directory')
			// by default favorites are sorted before other files
			expect(rows.at(1).attributes('data-filename')).toBe('favorite.txt')
			// other files are ascending
			expect(rows.at(2).attributes('data-filename')).toBe('a-file.txt')
			expect(rows.at(3).attributes('data-filename')).toBe('b-file.txt')
		})

		it('can sort descending by name', async () => {
			const nodes = [...exampleNodes]
			const wrapper = mount(FileList, {
				propsData: {
					currentView: 'files',
					multiselect: true,
					allowPickDirectory: false,
					loading: false,
					files: nodes,
					selectedFiles: [],
					path: '/',
				},
			})

			await wrapper.find('[data-test="file-picker_sort-name"]').trigger('click')

			const rows = wrapper.findAll('.file-picker__row')
			// all nodes are shown
			expect(rows.length).toBe(nodes.length)
			// folder are sorted first
			expect(rows.at(0).attributes('data-filename')).toBe('directory')
			// by default favorites are sorted before other files
			expect(rows.at(1).attributes('data-filename')).toBe('favorite.txt')
			// other files are descending
			expect(rows.at(2).attributes('data-filename')).toBe('b-file.txt')
			expect(rows.at(3).attributes('data-filename')).toBe('a-file.txt')
		})
	})
})
