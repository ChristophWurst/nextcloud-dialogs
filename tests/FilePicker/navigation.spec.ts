import type { Page } from 'playwright/test'

import { test, expect } from '@playwright/experimental-ct-vue2'
import FilePicker from '../../lib/components/FilePicker/FilePicker.vue'
import { readFileSync } from 'fs'

test.use({ viewport: { width: 1280, height: 800 } })

test.beforeEach(async ({ page }) => {
	await page.clock.setFixedTime(new Date('2024-07-09T22:00:00Z'))
})

/**
 *
 * @param page playwright page
 */
function mockRequests(page: Page) {
	const FIXTURE_PATH = `${import.meta.dirname}/../fixtures`
	// No views setup (state of a fresh installation)
	page.route('**/apps/files/api/v1/views', (route) => route.fulfill({
		json: {
			message: 'ok',
			data: [],
		},
	}))

	// Default config (state of a fresh installation)
	page.route('**/apps/files/api/v1/configs', (route) => route.fulfill({
		json: { message: 'ok', data: { crop_image_previews: true, show_hidden: false, sort_favorites_first: true, sort_folders_first: true, grid_view: false } },
	}))

	page.route('**/remote.php/dav/files/admin/', (route, request) => {
		if (request.method() === 'PROPFIND') {
			return route.fulfill({
				contentType: 'application/xml',
				headers: {
					DAV: '1, 3, extended-mkcol, access-control, calendarserver-principal-property-search, nextcloud-checksum-update, nc-calendar-search, nc-enable-birthday-calendar',
				},
				body: readFileSync(`${FIXTURE_PATH}/root.xml`),
			})
		} else if (request.method() === 'REPORT') {
			return route.fulfill({
				status: 207,
				contentType: 'application/xml',
				body: readFileSync(`${FIXTURE_PATH}/favorites.xml`),
			})
		}
		return route.continue()
	})

	page.route('**/remote.php/dav/files/admin/A%20folder/', (route, request) => {
		if (request.method() === 'PROPFIND') {
			return route.fulfill({
				contentType: 'application/xml',
				headers: {
					DAV: '1, 3, extended-mkcol, access-control, calendarserver-principal-property-search, nextcloud-checksum-update, nc-calendar-search, nc-enable-birthday-calendar',
				},
				body: readFileSync(`${FIXTURE_PATH}/folder.xml`),
			})
		}
		return route.continue()
	})

	page.route('**/remote.php/dav/', (route, request) => {
		if (request.method() === 'SEARCH') {
			return route.fulfill({
				status: 207,
				contentType: 'application/xml',
				body: readFileSync(`${FIXTURE_PATH}/recent.xml`),
			})
		}
		return route.continue()
	})
}

test('Can mount the file picker', async ({ mount, page }) => {
	mockRequests(page)

	page.route('**/remote.php/**', async (route) => {
		await new Promise((resolve) => setTimeout(resolve, Math.random() * 1000))
		await route.fallback()
	})

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	await expect(dialog.getByRole('heading', { level: 2, name: 'My test name' })).toBeVisible()
})

test('File picker loads root path', async ({ mount, page }) => {
	mockRequests(page)

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	await expect(dialog.getByRole('cell').filter({ hasText: 'A folder' })).toBeVisible()
	await expect(dialog.getByRole('cell').filter({ hasText: 'welcome.txt' })).toBeVisible()
	await expect(dialog.getByRole('cell').filter({ hasText: 'image.png' })).toBeVisible()
})

test('File picker loads specified path', async ({ mount, page }) => {
	mockRequests(page)

	const propfind = page.waitForRequest((request) => request.method() === 'PROPFIND')

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			path: '/A folder',
			buttons: [],
		},
	})

	// expect the request
	const request = await propfind
	expect(request.url()).toMatch(/files\/admin\/A%20folder/)

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	await expect(dialog.getByRole('cell').filter({ hasText: 'document.pdf' })).toBeVisible()
})

test('File picker loads last path', async ({ mount, page }) => {
	// Mock a previous open file picker
	await page.addScriptTag({ content: 'window.sessionStorage.setItem("NC.FilePicker.LastPath", "/A folder/")' })
	// Mock the DAV requests
	mockRequests(page)

	const propfind = page.waitForRequest((request) => request.method() === 'PROPFIND')

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	// expect the request
	const request = await propfind
	expect(request.url()).toMatch(/files\/admin\/A%20folder/)

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	await expect(dialog.getByRole('cell').filter({ hasText: 'document.pdf' })).toBeVisible()
})

test('File picker path prop has higher priority', async ({ mount, page }) => {
	// Mock a previous open file picker
	await page.addScriptTag({ content: 'window.sessionStorage.setItem("NC.FilePicker.LastPath", "/A folder/")' })
	// Mock the DAV requests
	mockRequests(page)

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			path: '/',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	await expect(dialog.getByRole('cell').filter({ hasText: 'A folder' })).toBeVisible()
})

test('File picker can show recent files', async ({ mount, page }) => {
	mockRequests(page)

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()

	const navigation = dialog.getByRole('navigation', { name: 'Views' })
	await expect(navigation).toBeVisible()

	const recent = navigation.getByRole('button', { name: 'Recent' })
	await expect(recent).toBeVisible()
	await recent.click()

	await expect(dialog.getByRole('heading').filter({ hasText: 'Recent' })).toBeVisible()
	// The recent entry has the aria option set
	await expect(recent).toHaveAttribute('aria-current', 'location')
	// There is only one entry (the image)
	await expect(dialog.getByRole('cell').filter({ hasText: 'image.png' })).toBeVisible()
})

test('File picker can show favorite files', async ({ mount, page }) => {
	mockRequests(page)

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()

	const navigation = dialog.getByRole('navigation', { name: 'Views' })
	await expect(navigation).toBeVisible()

	const favorite = navigation.getByRole('button', { name: 'Favorites' })
	await expect(favorite).toBeVisible()
	await favorite.click()

	await expect(dialog.getByRole('heading').filter({ hasText: 'Favorites' })).toBeVisible()
	// The favorite entry has the aria option set
	await expect(favorite).toHaveAttribute('aria-current', 'location')
	// There is only one entry (the document)
	await expect(dialog.getByRole('cell').filter({ hasText: 'document.pdf' })).toBeVisible()
})

test('File picker can navigate into folder', async ({ mount, page }) => {
	// Mock the DAV requests
	mockRequests(page)

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	const folder = dialog.getByRole('cell').filter({ hasText: 'A folder' })
	await expect(folder).toBeVisible()
	await folder.click()
	await expect(dialog.getByRole('cell').filter({ hasText: 'document.pdf' })).toBeVisible()
})

test('File picker stores last path', async ({ mount, page }) => {
	// Mock the DAV requests
	mockRequests(page)

	await mount(FilePicker, {
		props: {
			name: 'My test name',
			buttons: [],
		},
	})

	const dialog = page.getByRole('dialog')
	await expect(dialog).toBeVisible()
	const folder = dialog.getByRole('cell').filter({ hasText: 'A folder' })
	await expect(folder).toBeVisible()
	await folder.click()
	await expect(dialog.getByRole('cell').filter({ hasText: 'document.pdf' })).toBeVisible()

	const handle = await page.evaluateHandle(() => Promise.resolve(window))
	const value = await page.evaluate((window) => window.sessionStorage.getItem('NC.FilePicker.LastPath'), handle)
	expect(value).toMatch(/\/A folder/)
})
