<!--
  - SPDX-FileCopyrightText: 2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog dialog-classes="nc-generic-dialog"
		:buttons="buttons"
		:name="name"
		:message="text"
		@update:open="$emit('close')">
		<NcNoteCard v-if="severity" :type="severity">
			<p v-text="text" />
		</NcNoteCard>
		<!-- eslint-disable-next-line vue/no-v-html -->
		<div v-if="html" v-html="html" />
	</NcDialog>
</template>

<script setup lang="ts">
import type { IDialogButton } from './types'

import { onMounted, onUnmounted } from 'vue'
import { DialogSeverity } from './types'

import NcDialog from '@nextcloud/vue/components/NcDialog'
import NcNoteCard from '@nextcloud/vue/components/NcNoteCard'

const props = defineProps<{
	/**
	 * Headline of the dialog
	 */
	name: string

	/**
	 * Main text of the dialog
	 */
	text: string

	/**
	 * HTML content
	 * @deprecated DO NOT USE! This is just for backwards compatibility and will be removed in the near future!
	 */
	html?: string

	/**
	 * Buttons on the dialog
	 */
	buttons?: IDialogButton[]

	/**
	 * Severity of the dialog - if a notecard is used
	 */
	severity?: DialogSeverity
}>()

/**
 * Handler used to ensure the message is also shown when the page is unloaded
 * This is for backwards compatibility with OC.dialogs
 */
const handleUnload = () => `${props.name}: ${props.text}`

onMounted(() => window.addEventListener('unload', handleUnload))
onUnmounted(() => window.removeEventListener('unload', handleUnload))
</script>

<style>
.nc-generic-dialog .dialog__actions {
	justify-content: space-between;
	min-width: calc(100% - 12px);
}
</style>
