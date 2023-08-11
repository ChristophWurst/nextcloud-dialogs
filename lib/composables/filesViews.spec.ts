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

import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, type PropType } from 'vue'
import { useFilesViews, type FileListViews } from './filesSettings'

const axios = vi.hoisted(() => ({
	get: vi.fn(),
}))
vi.mock('@nextcloud/axios', () => ({ default: axios }))

const TestComponent = defineComponent({
	props: {
		currentView: {
			type: String as PropType<FileListViews>,
		},
	},
	setup(props) {
		const settings = useFilesViews(props.currentView)
		return {
			...settings,
		}
	},
	render: () => h('div'),
})

describe('files app views config composable', () => {
	beforeAll(() => { vi.useFakeTimers() })
	afterAll(() => { vi.useRealTimers() })
	afterEach(() => { vi.resetAllMocks() })

	it('Sets the inital state correctly', async () => {
		axios.get.mockImplementation(() => {
			return new Promise(() => {})
		})
		const vue = await shallowMount(TestComponent, {
			props: {
				currentView: 'files',
			},
		})
		expect(vue.vm.filesViewConfig).toEqual({ sortBy: 'basename', order: 'ascending' })
		expect(vue.vm.recentViewConfig).toEqual({ sortBy: 'basename', order: 'ascending' })
		expect(vue.vm.currentConfig).toEqual({ sortBy: 'basename', order: 'ascending' })
		expect(axios.get).toBeCalled()
	})

	it('is reactive when loading values', async () => {
		axios.get.mockImplementation(() => {
			return new Promise((resolve) => window.setTimeout(() => resolve({
				data: {
					data: {
						files: {
							sorting_mode: 'mtime',
							sorting_direction: 'desc',
						},
					},
				},
			}), 400))
		})
		const vue = await shallowMount(TestComponent, {
			props: {
				currentView: 'files',
			},
		})
		expect(vue.vm.filesViewConfig).toEqual({ sortBy: 'basename', order: 'ascending' })
		await vi.advanceTimersByTimeAsync(500)
		expect(vue.vm.filesViewConfig).toEqual({ sortBy: 'mtime', order: 'descending' })
	})
})
