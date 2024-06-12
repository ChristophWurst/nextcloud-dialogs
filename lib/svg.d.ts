/**
 * SPDX-FileCopyrightText: 2023 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */
declare module '*.svg' {
	const content: string
	export default content
}

declare module '*.svg?raw' {
	const content: string
	export default content
}
