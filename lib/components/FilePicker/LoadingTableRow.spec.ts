import { test, expect } from '@playwright/experimental-ct-vue2'
import LoadingTableRow from './LoadingTableRow.vue'

test('component mounts', async ({ mount }) => {
	const content = await mount(LoadingTableRow, {
		props: {
			showCheckbox: false,
		},
	})

	// Three cells
	await expect(content.locator('td')).toHaveCount(3)
	// No checkbox
	await expect(content.locator('.row-checkbox')).toHaveCount(0)
})

test('can show the checkbox', async ({ mount }) => {
	const content = await mount(LoadingTableRow, {
		props: {
			showCheckbox: true,
		},
	})

	// Now four cells
	await expect(content.locator('td')).toHaveCount(4)
	// and the checkbox
	await expect(content.locator('td').first()).toHaveClass('row-checkbox')
})

test('component is hidden for accessibility', async ({ mount }) => {
	const content = await mount(LoadingTableRow, {
		props: {
			showCheckbox: true,
		},
	})

	await expect(content).toHaveAttribute('aria-hidden', 'true')
})
