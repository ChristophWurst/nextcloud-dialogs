/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, it, expect, vi, afterEach, beforeAll, afterAll } from 'vitest'
import { shallowMount } from '@vue/test-utils'
import { defineComponent, h, nextTick } from 'vue'
import { useFilesSettings } from './filesSettings'

const axios = vi.hoisted(() => ({
	get: vi.fn(),
}))
const isPublic = vi.hoisted(() => ({ value: false }))

vi.mock('@nextcloud/axios', () => ({ default: axios }))
vi.mock('./isPublic', () => ({ useIsPublic: () => ({ isPublic }) }))

const TestComponent = defineComponent({
	setup() {
		const settings = useFilesSettings()
		return {
			...settings,
		}
	},
	render: () => h('div'),
})

describe('files app settings composable', () => {
	beforeAll(() => { vi.useFakeTimers() })
	afterAll(() => { vi.useRealTimers() })
	afterEach(() => { vi.resetAllMocks() })

	it('Sets the inital state correctly', async () => {
		axios.get.mockImplementation(() => {
			return new Promise(() => {})
		})
		const vue = shallowMount(TestComponent)
		await nextTick()

		expect(vue.vm.showHiddenFiles).toBe(true)
		expect(vue.vm.sortFavoritesFirst).toBe(true)
		expect(vue.vm.cropImagePreviews).toBe(true)
		expect(axios.get).toBeCalled()
	})

	it('is reactive when loading values', async () => {
		axios.get.mockImplementation(() => {
			return new Promise((resolve) => window.setTimeout(() => resolve({ data: { data: { show_hidden: false } } }), 400))
		})
		const vue = shallowMount(TestComponent)
		await nextTick()

		expect(vue.vm.showHiddenFiles).toBe(true)
		await vi.advanceTimersByTimeAsync(500)
		await nextTick()
		expect(vue.vm.showHiddenFiles).toBe(false)
	})
})
