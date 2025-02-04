/**
 * SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

import type { ComputedRef, Ref } from 'vue'

import { mdiClock, mdiFolder, mdiStar } from '@mdi/js'
import { t } from '../utils/l10n'

export type IFilesViewId = 'files' | 'favorites' | 'recent'

export interface IFilesView {
	/**
	 * Unique ID of the view
	 */
	id: IFilesViewId
	/**
	 * Localized name of the view
	 */
	label: string
	/**
	 * The SVG icon paths
	 */
	icon: string
}

/**
 * Get available file views
 * @param isAnonymous
 */
export const useViews = (isAnonymous: Ref<boolean> | ComputedRef<boolean>) => {

	/**
	 * All defined views
	 */
	const allViews = [
		{
			id: 'files',
			label: t('All files'),
			icon: mdiFolder,
		},
		{
			id: 'recent',
			label: t('Recent'),
			icon: mdiClock,
		},
		{
			id: 'favorites',
			label: t('Favorites'),
			icon: mdiStar,
		},
	] as IFilesView[]

	/**
	 * Views which are available for the current user
	 */
	const availableViews = isAnonymous.value ? allViews.filter(({ id }) => id === 'files') : allViews

	return {
		allViews,
		availableViews,
	}
}
