<!--
  - SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<tr :tabindex="(showCheckbox && !isDirectory) ? undefined : 0"
		:aria-selected="!isPickable ? undefined : selected"
		:class="['file-picker__row', {
			'file-picker__row--selected': selected && !showCheckbox
		}]"
		:data-filename="node.basename"
		data-testid="file-list-row"
		v-on="{
			click: handleClick,
			/* same as tabindex -> if we hide the checkbox or this is a directory we need keyboard access to enter the directory or select the node */
			...(!showCheckbox || isDirectory ? { keydown: handleKeyDown } : {}),
		}">
		<td v-if="showCheckbox" class="row-checkbox" @click.stop="() => {/* Stop the click event */}">
			<NcCheckboxRadioSwitch :aria-label="t('Select the row for {nodename}', { nodename: displayName })"
				:model-value="selected"
				:disabled="!isPickable"
				data-testid="row-checkbox"
				@update:model-value="toggleSelected" />
		</td>
		<td class="row-name">
			<div class="file-picker__name-container" data-testid="row-name">
				<FilePreview :node="node" :crop-image-previews="cropImagePreviews" />
				<div class="file-picker__file-name" :title="displayName" v-text="displayName" />
				<div class="file-picker__file-extension" v-text="fileExtension" />
			</div>
		</td>
		<td class="row-size">
			{{ formatFileSize(node.size || 0) }}
		</td>
		<td class="row-modified">
			<NcDateTime :timestamp="node.mtime" :ignore-seconds="true" />
		</td>
	</tr>
</template>
<script setup lang="ts">
import type { Node } from '@nextcloud/files'

import { formatFileSize, FileType } from '@nextcloud/files'
import { NcCheckboxRadioSwitch, NcDateTime } from '@nextcloud/vue'
import { computed } from 'vue'
import { t } from '../../utils/l10n'

import FilePreview from './FilePreview.vue'

const props = defineProps<{
	/** Can directories be picked */
	allowPickDirectory: boolean
	/** Is this node currently selected */
	selected: boolean
	/** Whether to show the checkbox in first column */
	showCheckbox: boolean
	/** Whether the node can be picked */
	canPick: boolean
	/** The current node */
	node: Node
	/** Whether the preview should be cropped */
	cropImagePreviews: boolean
}>()

const emit = defineEmits<{
	/** Emitted when the selected state is changed */
	(e: 'update:selected', v: boolean): void
	/** Emitted when a directory was not selected but entered */
	(e: 'enter-directory', node: Node): void
}>()

/**
 * The displayname of the current node (excluding file extension)
 */
const displayName = computed(() => props.node.attributes?.displayName || props.node.basename.slice(0, props.node.extension ? -props.node.extension.length : undefined))

/**
 * The file extension of the file
 */
const fileExtension = computed(() => props.node.extension)

/**
 * Check if the node is a directory
 */
const isDirectory = computed(() => props.node.type === FileType.Folder)

/**
 * If this node can be picked, basically just check if picking a directory is allowed
 */
const isPickable = computed(() => props.canPick && (props.allowPickDirectory || !isDirectory.value))

/**
 * Toggle the selection state
 */
function toggleSelected() {
	emit('update:selected', !props.selected)
}

/**
 * Handle clicking the table row, if it is a directory it is opened, else selected
 */
function handleClick() {
	if (isDirectory.value) {
		emit('enter-directory', props.node)
	} else {
		toggleSelected()
	}
}

/**
 * Handle keydown on the table row, pressing the enter key will be similar to clicking for keyboard navigation
 * @param event The Keydown event
 */
function handleKeyDown(event: KeyboardEvent) {
	if (event.key === 'Enter') {
		handleClick()
	}
}
</script>

<style scoped lang="scss">
@use './FileList.scss';

.file-picker {
	&__row {
		&--selected {
			background-color: var(--color-background-dark);
		}
		&:hover {
			background-color: var(--color-background-hover);
		}
	}

	&__name-container {
		display: flex;
		justify-content: start;
		align-items: center;
		height: 100%;
	}

	&__file-name {
		padding-inline-start: 6px;
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	&__file-extension {
		color: var(--color-text-maxcontrast);
		min-width: fit-content;
	}
}
</style>
