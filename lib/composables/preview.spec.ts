/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { getPreviewURL, usePreviewURL } from './preview'
import { File } from '@nextcloud/files'
import { defineComponent, h, toRef } from 'vue'
import { shallowMount } from '@vue/test-utils'

describe('preview composable', () => {
	const createData = (path: string, mime: string) => ({
		owner: null,
		source: `http://example.com/dav/${path}`,
		mime,
		mtime: new Date(),
		root: '/',
	})

	describe('previewURL', () => {
		beforeAll(() => {
			vi.useFakeTimers()
		})
		afterAll(() => {
			vi.useRealTimers()
		})

		it('is reactive', async () => {
			const text = new File({
				...createData('text.txt', 'text/plain'),
				id: 1,
			})
			const image = new File({
				...createData('image.png', 'image/png'),
				id: 2,
			})

			const wrapper = shallowMount(defineComponent({
				props: ['node'],
				setup(props) {
					const { previewURL } = usePreviewURL(toRef(props, 'node'))
					return () => h('div', previewURL.value?.href)
				},
			}), {
				props: { node: text },
			})

			expect(wrapper.text()).toMatch('/core/preview?fileId=1')
			await wrapper.setProps({ node: image })
			expect(wrapper.text()).toMatch('/core/preview?fileId=2')
		})

		it('uses etag for cache busting', () => {
			const previewNode = new File({
				...createData('tst.txt', 'text/plain'),
				attributes: {
					etag: 'the-etag',
				},
			})

			const { previewURL } = usePreviewURL(previewNode)
			expect(previewURL.value?.searchParams.get('c')).toBe('the-etag')
		})

		it('uses Nodes previewUrl if available', () => {
			const previewNode = new File({
				...createData('text.txt', 'text/plain'),
				attributes: {
					previewUrl: '/preview.svg',
				},
			})
			const { previewURL } = usePreviewURL(previewNode)

			expect(previewURL.value?.pathname).toBe('/preview.svg')
		})

		it('works with full URL previewUrl', () => {
			const previewNode = new File({
				...createData('text.txt', 'text/plain'),
				attributes: {
					previewUrl: 'http://example.com/preview.svg',
				},
			})
			const { previewURL } = usePreviewURL(previewNode)

			expect(previewURL.value?.href.startsWith('http://example.com/preview.svg?')).toBe(true)
		})

		it('supports options', () => {
			const previewNode = new File(createData('text.txt', 'text/plain'))

			expect(getPreviewURL(previewNode, { size: 16 })?.searchParams.get('x')).toBe('16')
			expect(getPreviewURL(previewNode, { size: 16 })?.searchParams.get('y')).toBe('16')

			expect(getPreviewURL(previewNode, { mimeFallback: false })?.searchParams.get('mimeFallback')).toBe('false')
		})
	})
})
