/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { describe, expect, it } from 'vitest'
import { ref } from 'vue'
import { useViews } from './views'

describe('views composable', () => {
	it('contains all views', () => {
		const { allViews } = useViews(ref(false))
		expect(allViews.length).toBe(3)
		expect(allViews.find(({ id }) => id === 'files')).not.toBe(undefined)
		expect(allViews.find(({ id }) => id === 'recent')).not.toBe(undefined)
		expect(allViews.find(({ id }) => id === 'favorites')).not.toBe(undefined)
	})

	it('has all views on internal route', () => {
		const { availableViews, allViews } = useViews(ref(false))
		expect(allViews.length).toBe(3)
		expect(availableViews.length).toBe(3)
		for (const view of allViews) {
			expect(availableViews.includes(view)).toBe(true)
		}
	})

	it('has only the files views on public route', () => {
		const { availableViews, allViews } = useViews(ref(true))
		expect(allViews.length).toBe(3)
		expect(availableViews.length).toBe(1)
		expect(availableViews[0].id).toBe('files')
	})
})
