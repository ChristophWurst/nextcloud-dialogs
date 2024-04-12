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
import type { Folder, Node } from '@nextcloud/files'
import type { ComputedRef, Ref } from 'vue'
import type { FileStat, ResponseDataDetailed, SearchResult } from 'webdav'

import { davGetClient, davGetDefaultPropfind, davGetRecentSearch, davRemoteURL, davResultToNode, davRootPath, getFavoriteNodes } from '@nextcloud/files'
import { generateRemoteUrl } from '@nextcloud/router'
import { dirname, join } from 'path'
import { computed, ref, watch } from 'vue'

/**
 * Handle file loading using WebDAV
 *
 * @param currentView Reference to the current files view
 * @param currentPath Reference to the current files path
 * @param isPublicEndpoint Whether the filepicker is used on a public share
 */
export const useDAVFiles = function(
	currentView: Ref<'files'|'recent'|'favorites'> | ComputedRef<'files'|'recent'|'favorites'>,
	currentPath: Ref<string> | ComputedRef<string>,
	isPublicEndpoint: Ref<boolean> | ComputedRef<boolean>,
): { isLoading: Ref<boolean>, createDirectory: (name: string) => Promise<Folder>, files: Ref<Node[]>, loadFiles: () => Promise<void>, getFile: (path: string) => Promise<Node> } {

	const defaultRootPath = computed(() => isPublicEndpoint.value ? '/' : davRootPath)

	const defaultRemoteUrl = computed(() => {
		if (isPublicEndpoint.value) {
			return generateRemoteUrl('webdav').replace('/remote.php', '/public.php')
		}
		return davRemoteURL
	})

	/**
	 * The WebDAV client
	 */
	const client = computed(() => {
		if (isPublicEndpoint.value) {
			const token = (document.getElementById('sharingToken')! as HTMLInputElement).value
			const autorization = btoa(`${token}:null`)

			const client = davGetClient(defaultRemoteUrl.value)
			client.setHeaders({ Authorization: `Basic ${autorization}` })
			return client
		}

		return davGetClient()
	})

	const resultToNode = (result: FileStat) => {
		const node = davResultToNode(result, defaultRootPath.value, defaultRemoteUrl.value)
		// Fixed for @nextcloud/files 3.1.0 but not supported on Nextcloud 27 so patching it
		if (isPublicEndpoint.value) {
			return new Proxy(node, {
				get(node, prop) {
					if (prop === 'dirname' || prop === 'path') {
						const source = node.source
						let path = source.slice(defaultRemoteUrl.value.length)
						if (path[0] !== '/') {
							path = `/${path}`
						}
						if (prop === 'dirname') {
							return dirname(path)
						}
						return path
					}
					return (node as never)[prop]
				},
			})
		}
		return node
	}

	/**
	 * All queried files
	 */
	const files = ref<Node[]>([] as Node[]) as Ref<Node[]>

	/**
	 * Loading state of the files
	 */
	const isLoading = ref(true)

	/**
	 * Create a new directory in the current path
	 * @param name Name of the new directory
	 * @return {Promise<Folder>} The created directory
	 */
	async function createDirectory(name: string): Promise<Folder> {
		const path = join(currentPath.value, name)

		await client.value.createDirectory(join(defaultRootPath.value, path))
		const directory = await getFile(path) as Folder
		files.value.push(directory)
		return directory
	}

	/**
	 * Get information for one file
	 * @param path The path of the file or folder
	 * @param rootPath The dav root path to use (or the default is nothing set)
	 */
	async function getFile(path: string, rootPath: string|undefined = undefined) {
		rootPath = rootPath ?? defaultRootPath.value

		const { data } = await client.value.stat(`${rootPath}${path}`, {
			details: true,
			data: davGetDefaultPropfind(),
		}) as ResponseDataDetailed<FileStat>
		return resultToNode(data)
	}

	/**
	 * Load files using the DAV client
	 */
	async function loadDAVFiles() {
		isLoading.value = true

		if (currentView.value === 'favorites') {
			files.value = await getFavoriteNodes(client.value, currentPath.value, defaultRootPath.value)
		} else if (currentView.value === 'recent') {
			// unix timestamp in seconds, two weeks ago
			const lastTwoWeek = Math.round(Date.now() / 1000) - (60 * 60 * 24 * 14)
			const { data } = await client.value.search('/', {
				details: true,
				data: davGetRecentSearch(lastTwoWeek),
			}) as ResponseDataDetailed<SearchResult>
			files.value = data.results.map(resultToNode)
		} else {
			const results = await client.value.getDirectoryContents(`${defaultRootPath.value}${currentPath.value}`, {
				details: true,
				data: davGetDefaultPropfind(),
			}) as ResponseDataDetailed<FileStat[]>
			files.value = results.data.map(resultToNode)

			// Hack for the public endpoint which always returns folder itself
			if (isPublicEndpoint.value) {
				files.value = files.value.filter((file) => file.path !== currentPath.value)
			}
		}

		isLoading.value = false
	}

	/**
	 * Watch for ref changes
	 */
	watch([currentView, currentPath], () => loadDAVFiles())

	return {
		isLoading,
		files,
		loadFiles: () => loadDAVFiles(),
		getFile,
		createDirectory,
	}
}
