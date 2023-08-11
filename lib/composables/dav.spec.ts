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

import type { Ref } from 'vue'
import { describe, it, expect, vi, afterEach } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, ref, toRef, nextTick } from 'vue'
import { useDAVFiles } from './dav'

const nextcloudFiles = vi.hoisted(() => ({
	davGetClient: vi.fn(),
	davRootPath: '/root/uid',
	davRemoteURL: 'https://localhost/remote.php/dav',
	davResultToNode: vi.fn(),
	davGetDefaultPropfind: vi.fn(),
	davGetRecentSearch: (time: number) => `recent ${time}`,
	getFavoriteNodes: vi.fn(),
}))
vi.mock('@nextcloud/files', () => nextcloudFiles)

const waitLoaded = (vue: ReturnType<typeof shallowMount>) => new Promise((resolve) => {
	const w = () => {
		if (vue.vm.isLoading) window.setTimeout(w, 50)
		else resolve(true)
	}
	w()
})

const waitRefLoaded = (isLoading: Ref<boolean>) => new Promise((resolve) => {
	const w = () => {
		if (isLoading.value) window.setTimeout(w, 50)
		else resolve(true)
	}
	w()
})

const TestComponent = defineComponent({
	props: ['currentView', 'currentPath', 'isPublic'],
	setup(props) {
		const dav = useDAVFiles(toRef(props, 'currentView'), toRef(props, 'currentPath'), toRef(props, 'isPublic'))
		return {
			...dav,
		}
	},
	render: () => h('div'),
})

describe('dav composable', () => {
	afterEach(() => { vi.resetAllMocks() })

	it('Sets the inital state correctly', () => {
		const client = {
			getDirectoryContents: vi.fn(() => ({ data: [] })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)

		const vue = shallowMount(TestComponent, {
			props: {
				currentView: 'files',
				currentPath: '/',
				isPublic: false,
			},
		})
		// Loading is set to true
		expect(vue.vm.isLoading).toBe(true)
		// Dav client for dav remote url is gathered
		expect(nextcloudFiles.davGetClient).toBeCalled()
		// files is an empty array
		expect(Array.isArray(vue.vm.files)).toBe(true)
		expect(vue.vm.files.length).toBe(0)
		// functions
		expect(typeof vue.vm.getFile === 'function').toBe(true)
		expect(typeof vue.vm.loadFiles === 'function').toBe(true)
	})

	it('loads initial file list', async () => {
		const client = {
			getDirectoryContents: vi.fn(() => ({ data: ['1', '2'] })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)
		nextcloudFiles.davResultToNode.mockImplementation((v) => `node ${v}`)

		const vue = shallowMount(TestComponent, {
			props: {
				currentView: 'files',
				currentPath: '/',
				isPublic: false,
			},
		})

		// wait until files are loaded
		await waitLoaded(vue)

		expect(vue.vm.files).toEqual(['node 1', 'node 2'])
	})

	it('reloads on path change', async () => {
		const client = {
			getDirectoryContents: vi.fn((str) => ({ data: [] })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)

		const vue = shallowMount(TestComponent, {
			props: {
				currentView: 'files',
				currentPath: '/',
				isPublic: false,
			},
		})

		// wait until files are loaded
		await waitLoaded(vue)

		expect(client.getDirectoryContents).toBeCalledTimes(1)
		expect(client.getDirectoryContents.mock.calls[0][0]).toBe(`${nextcloudFiles.davRootPath}/`)

		vue.setProps({ currentPath: '/other' })
		await waitLoaded(vue)

		expect(client.getDirectoryContents).toBeCalledTimes(2)
		expect(client.getDirectoryContents.mock.calls[1][0]).toBe(`${nextcloudFiles.davRootPath}/other`)
	})

	it('reloads on view change', async () => {
		const client = {
			getDirectoryContents: vi.fn((str) => ({ data: [] })),
			search: vi.fn((str) => ({ data: { results: [], truncated: false } })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)

		const vue = shallowMount(TestComponent, {
			props: {
				currentView: 'files',
				currentPath: '/',
				isPublic: false,
			},
		})

		// wait until files are loaded
		await waitLoaded(vue)

		expect(client.search).not.toBeCalled()
		expect(client.getDirectoryContents).toBeCalledTimes(1)
		expect(client.getDirectoryContents.mock.calls[0][0]).toBe(`${nextcloudFiles.davRootPath}/`)

		vue.setProps({ currentView: 'recent' })
		await waitLoaded(vue)

		// Uses search instead of getDirectoryContents
		expect(client.getDirectoryContents).toBeCalledTimes(1)
		expect(client.search).toBeCalledTimes(1)
	})

	it('getFile works', async () => {
		const client = {
			stat: vi.fn((v) => ({ data: { path: v } })),
			getDirectoryContents: vi.fn(() => ({ data: [] })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)
		nextcloudFiles.davResultToNode.mockImplementationOnce((v) => v)

		const { getFile } = useDAVFiles(ref('files'), ref('/'), ref(false))

		const node = await getFile('/some/path')
		expect(node).toEqual({ path: `${nextcloudFiles.davRootPath}/some/path` })
		expect(client.stat).toBeCalledWith(`${nextcloudFiles.davRootPath}/some/path`, { details: true })
		expect(nextcloudFiles.davResultToNode).toBeCalledWith({ path: `${nextcloudFiles.davRootPath}/some/path` }, nextcloudFiles.davRootPath, nextcloudFiles.davRemoteURL)
	})

	it('createDirectory works', async () => {
		const client = {
			stat: vi.fn((v) => ({ data: { path: v } })),
			createDirectory: vi.fn(() => {}),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)
		nextcloudFiles.davResultToNode.mockImplementationOnce((v) => v)

		const { createDirectory } = useDAVFiles(ref('files'), ref('/foo/'), ref(false))

		const node = await createDirectory('my-name')
		expect(node).toEqual({ path: `${nextcloudFiles.davRootPath}/foo/my-name` })
		expect(client.stat).toBeCalledWith(`${nextcloudFiles.davRootPath}/foo/my-name`, { details: true })
		expect(client.createDirectory).toBeCalledWith(`${nextcloudFiles.davRootPath}/foo/my-name`)
	})

	it('loadFiles work', async () => {
		const client = {
			stat: vi.fn((v) => ({ data: { path: v } })),
			getDirectoryContents: vi.fn((p, o) => ({ data: [] })),
			search: vi.fn((p, o) => ({ data: { results: [], truncated: false } })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)
		nextcloudFiles.davResultToNode.mockImplementationOnce((v) => v)

		const view = ref<'files' | 'recent' | 'favorites'>('files')
		const path = ref('/')
		const { loadFiles, isLoading } = useDAVFiles(view, path, ref(false))

		expect(isLoading.value).toBe(true)
		await loadFiles()
		expect(isLoading.value).toBe(false)
		expect(client.getDirectoryContents).toBeCalledWith(`${nextcloudFiles.davRootPath}/`, expect.objectContaining({ details: true }))

		view.value = 'recent'
		await waitRefLoaded(isLoading)
		expect(client.search).toBeCalledWith('/', expect.objectContaining({ details: true }))

		view.value = 'favorites'
		await waitRefLoaded(isLoading)
		expect(nextcloudFiles.getFavoriteNodes).toBeCalled()
	})

	it('request cancelation works', async () => {
		const client = {
			stat: vi.fn((v) => ({ data: { path: v } })),
			getDirectoryContents: vi.fn((p, o) => ({ data: [] })),
			search: vi.fn((p, o) => ({ data: { results: [], truncated: false } })),
		}
		nextcloudFiles.davGetClient.mockImplementationOnce(() => client)
		nextcloudFiles.davResultToNode.mockImplementationOnce((v) => v)

		const view = ref<'files' | 'recent' | 'favorites'>('files')
		const path = ref('/')
		const { loadFiles, isLoading } = useDAVFiles(view, path, ref(false))

		const abort = vi.spyOn(AbortController.prototype, 'abort')

		loadFiles()
		view.value = 'recent'
		await waitRefLoaded(isLoading)
		expect(abort).toBeCalledTimes(1)

		view.value = 'files'
		await nextTick()
		view.value = 'recent'
		await nextTick()
		view.value = 'favorites'
		await waitRefLoaded(isLoading)
		expect(abort).toBeCalledTimes(2)
	})
})
