<!--
  - SPDX-FileCopyrightText: 2023-2024 Nextcloud GmbH and Nextcloud contributors
  - SPDX-License-Identifier: AGPL-3.0-or-later
-->
<template>
	<NcDialog v-model:open="isOpen"
		:container="container"
		:buttons="dialogButtons"
		:name="name"
		size="large"
		content-classes="file-picker__content"
		dialog-classes="file-picker"
		navigation-classes="file-picker__navigation"
		@update:open="handleClose">
		<template #navigation="{ isCollapsed }">
			<FilePickerNavigation v-model:current-view="currentView"
				v-model:filter-string="filterString"
				:is-collapsed="isCollapsed"
				:disabled-navigation="disabledNavigation" />
		</template>

		<div class="file-picker__main">
			<!-- Header title / file list breadcrumbs -->
			<FilePickerBreadcrumbs v-if="currentView === 'files'"
				v-model:path="currentPath"
				:show-menu="allowPickDirectory"
				@create-node="onCreateFolder" />
			<div v-else class="file-picker__view">
				<h3>{{ viewHeadline }}</h3>
			</div>

			<!-- File list -->
			<!-- If loading or files found show file list, otherwise show empty content-->
			<FileList v-if="isLoading || filteredFiles.length > 0"
				v-model:path="currentPath"
				v-model:selected-files="selectedFiles"
				:allow-pick-directory="allowPickDirectory"
				:current-view="currentView"
				:files="filteredFiles"
				:multiselect="multiselect"
				:loading="isLoading"
				:name="viewHeadline"
				@update:path="currentView = 'files'" />
			<NcEmptyContent v-else-if="filterString"
				:name="t('No matching files')"
				:description="t('No files matching your filter were found.')">
				<template #icon>
					<IconFile />
				</template>
			</NcEmptyContent>
			<NcEmptyContent v-else
				:name="t('No files in here')"
				:description="noFilesDescription">
				<template #icon>
					<IconFile />
				</template>
			</NcEmptyContent>
		</div>
	</NcDialog>
</template>

<script setup lang="ts">
import type { Node } from '@nextcloud/files'
import type { IFilePickerButton, IFilePickerButtonFactory, IFilePickerFilter } from '../types.ts'
import type { IFilesViewId } from '../../composables/views.ts'

import IconFile from 'vue-material-design-icons/File.vue'
import FileList from './FileList.vue'
import FilePickerBreadcrumbs from './FilePickerBreadcrumbs.vue'
import FilePickerNavigation from './FilePickerNavigation.vue'

import { emit as emitOnEventBus } from '@nextcloud/event-bus'
import { NcDialog, NcEmptyContent } from '@nextcloud/vue'
import { computed, onMounted, ref, shallowRef, toRef, watch } from 'vue'
import { showError } from '../../toast'
import { useDAVFiles } from '../../composables/dav'
import { useMimeFilter } from '../../composables/mime'
import { useFilesSettings } from '../../composables/filesSettings'
import { t } from '../../utils/l10n'

const props = withDefaults(defineProps<{
	/** Buttons to be displayed */
	buttons: IFilePickerButton[] | IFilePickerButtonFactory

	/** The name of file picker dialog (heading) */
	name: string

	/**
	 * Can directories be picked
	 * @default false
	 */
	allowPickDirectory?: boolean

	/**
	 * Is the navigation disabled
	 */
	 disabledNavigation?: boolean

	/**
	 * Where to mount the dialog
	 * @default 'body'
	 */
	container?: string

	/**
	 * Custom filter function used to filter pickable files
	 */
	filterFn?: IFilePickerFilter

	/**
	 * List of allowed mime types
	 * You can use placeholders for e.g. allowing all subtypes of images `['image/*']`.
	 * Note that if unset all files are allowed, which is the same as passing `['*∕*']`
	 * @default []
	 */
	mimetypeFilter?: string[]

	/**
	 * Is it allowed to pick multiple files
	 * @default true
	 */
	multiselect?: boolean

	/**
	 * The initial path of the file picker
	 * @default '/'
	 */
	 path?: string
}>(), {
	allowPickDirectory: false,
	disabledNavigation: false,
	container: 'body',
	filterFn: undefined,
	mimetypeFilter: () => [],
	multiselect: true,
	path: undefined,
})

const emit = defineEmits<{
	(e: 'close', v?: Node[]): void
}>()

const isOpen = ref(true)

/**
 * Map buttons to Dialog buttons by wrapping the callback function to pass the selected files
 */
const dialogButtons = computed(() => {
	const nodes = selectedFiles.value.length === 0
		&& props.allowPickDirectory
		&& currentFolder.value
		? [currentFolder.value]
		: selectedFiles.value

	const buttons = typeof props.buttons === 'function'
		? props.buttons(nodes, currentPath.value, currentView.value)
		: props.buttons

	return buttons.map((button) => ({
		...button,
		disabled: button.disabled || isLoading.value,
		callback: () => {
			// lock default close handling
			isHandlingCallback = true
			handleButtonClick(button.callback, nodes)
		},
	} as IFilePickerButton))
})

/**
 * Flag that is set when a button was clicked to prevent the default close event to be emitted
 * This is needed as `handleButtonClick` is async and thus might execute after NcDialog already closed
 */
let isHandlingCallback = false

const handleButtonClick = async (callback: IFilePickerButton['callback'], nodes: Node[]) => {
	callback(nodes)
	emit('close', nodes)
	// Unlock close
	isHandlingCallback = false
}

/**
 * Name of the currently active view
 */
const currentView = ref<IFilesViewId>('files')

/**
 * Headline to be used on the current view
 */
const viewHeadline = computed(() => currentView.value === 'favorites' ? t('Favorites') : (currentView.value === 'recent' ? t('Recent') : ''))

/**
 * All currently selected files
 */
const selectedFiles = shallowRef<Node[]>([])

/**
 * Last path navigated to using the file picker
 * (required as sessionStorage is not reactive)
 */
const savedPath = ref(window?.sessionStorage.getItem('NC.FilePicker.LastPath') || '/')

/**
 * The path the user manually navigated to using this filepicker instance
 */
const navigatedPath = ref('')
// Save the navigated path to the session storage on change
watch([navigatedPath], () => {
	if (props.path === undefined && navigatedPath.value) {
		window.sessionStorage.setItem('NC.FilePicker.LastPath', navigatedPath.value)
	}
	// Reset selected files
	selectedFiles.value = []
})

/**
 * The current path that should be picked from
 */
const currentPath = computed({
	get: () => {
		// Only use the path for the files view as favorites and recent only works on the root
		return currentView.value === 'files' ? navigatedPath.value || props.path || savedPath.value : '/'
	},
	set: (path: string) => {
		// forward setting the current path to the navigated path
		navigatedPath.value = path
	},
})

/**
 * A string used to filter files in current view
 */
const filterString = ref('')

const { isSupportedMimeType } = useMimeFilter(toRef(props, 'mimetypeFilter')) // vue 3.3 will allow cleaner syntax of toRef(() => props.mimetypeFilter)

const {
	files,
	folder: currentFolder,
	isLoading,
	loadFiles,
	createDirectory,
} = useDAVFiles(currentView, currentPath)

onMounted(() => loadFiles())

const { showHiddenFiles } = useFilesSettings()

/**
 * The files list filtered by the current value of the filter input
 */
const filteredFiles = computed(() => {
	let filtered = files.value

	if (!showHiddenFiles.value) {
		// Hide hidden files if not configured otherwise
		filtered = filtered.filter((file) => !file.basename.startsWith('.'))
	}
	if (props.mimetypeFilter.length > 0) {
		// filter by mime type but always include folders to navigate
		filtered = filtered.filter(file => file.type === 'folder' || (file.mime && isSupportedMimeType(file.mime)))
	}
	if (filterString.value) {
		filtered = filtered.filter((file) => file.basename.toLowerCase().includes(filterString.value.toLowerCase()))
	}
	if (props.filterFn) {
		filtered = filtered.filter((f) => props.filterFn!(f as Node))
	}
	return filtered
})

/**
 * If no files are found in the current view this message will be shown in the EmptyContent
 */
const noFilesDescription = computed(() => {
	if (currentView.value === 'files') {
		return t('Upload some content or sync with your devices!')
	} else if (currentView.value === 'recent') {
		return t('Files and folders you recently modified will show up here.')
	} else {
		return t('Files and folders you mark as favorite will show up here.')
	}
})

/**
 * Handle creating new folder (breadcrumb menu)
 * This will create the folder using WebDAV, reload the directory content and signal the directory creation to fhe files app
 *
 * @param name The new folder name
 */
const onCreateFolder = async (name: string) => {
	try {
		const folder = await createDirectory(name)
		navigatedPath.value = folder.path
		// emit event bus to force files app to reload that file if needed
		emitOnEventBus('files:node:created', files.value.filter((file) => file.basename === name)[0])
	} catch (error) {
		console.warn('Could not create new folder', { name, error })
		// show error to user
		showError(t('Could not create the new folder'))
	}
}

/**
 * Handle closing the file picker
 * @param open If the dialog is open
 */
const handleClose = (open: boolean) => {
	if (!open && !isHandlingCallback) {
		emit('close')
	}
}
</script>

<script lang="ts">
export default {
	name: 'FilePicker',
}
</script>

<style scoped lang="scss">
.file-picker {
	&__view {
		height: 50px; // align with breadcrumbs
		display: flex;
		justify-content: start;
		align-items: center;

		h3 {
			font-weight: bold;
			height: fit-content;
			margin: 0;
		}
	}

	&__main {
		box-sizing: border-box;
		width: 100%;
		display: flex;
		flex-direction: column;
		// Auto fit height
		min-height: 0;
		flex: 1;
		// align with navigation on smaller screens
		padding-inline: 2px;

		* {
			box-sizing: border-box;
		}
	}
}

:deep(.file-picker) {
	// Dialog is max. 900px wide so the best looking height seems to be 800px
	height: min(80vh, 800px)!important;
}

@media (max-width: 512px) {
	:deep(.file-picker) {
		// below 512px the modal is fullscreen so we use 100% height - margin of heading (4px + 12px) - height of heading (default-clickable-area)
		height: calc(100% - 16px - var(--default-clickable-area))!important;
	}
}

:deep(.file-picker__content) {
	display: flex;
	flex-direction: column;
	overflow: hidden;
}
</style>
