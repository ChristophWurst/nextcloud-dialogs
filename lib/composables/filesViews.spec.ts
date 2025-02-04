/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
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
