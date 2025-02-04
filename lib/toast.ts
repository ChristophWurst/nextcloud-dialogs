/**
 * SPDX-FileCopyrightText: 2019 Nextcloud GmbH and Nextcloud contributors
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/// <reference types="toastify-js" />

import Toastify from 'toastify-js'
import { t } from './utils/l10n.js'

import '../styles/toast.scss'

import LoaderSvg from '../styles/loader.svg?raw'

/**
 * Enum of available Toast types
 */
export enum ToastType {
	ERROR = 'toast-error',
	WARNING = 'toast-warning',
	INFO = 'toast-info',
	SUCCESS = 'toast-success',
	PERMANENT = 'toast-error',
	UNDO = 'toast-undo',
	LOADING = 'toast-loading',
}

/** @deprecated Use ToastAriaLive.OFF */
export const TOAST_ARIA_LIVE_OFF = 'off'
/** @deprecated Use ToastAriaLive.POLITE */
export const TOAST_ARIA_LIVE_POLITE = 'polite'
/** @deprecated Use ToastAriaLive.ASSERTIVE */
export const TOAST_ARIA_LIVE_ASSERTIVE = 'assertive'

export enum ToastAriaLive {
	OFF = TOAST_ARIA_LIVE_OFF,
	POLITE = TOAST_ARIA_LIVE_POLITE,
	ASSERTIVE = TOAST_ARIA_LIVE_ASSERTIVE,
}

/** Timeout in ms of a undo toast */
export const TOAST_UNDO_TIMEOUT = 10000
/** Default timeout in ms of toasts */
export const TOAST_DEFAULT_TIMEOUT = 7000
/** Timeout value to show a toast permanently */
export const TOAST_PERMANENT_TIMEOUT = -1

/**
 * Type of a toast
 * @see https://apvarun.github.io/toastify-js/
 * @notExported
 */
type Toast = ReturnType<typeof Toastify>

export interface ToastOptions {
	/**
	 * Defines the timeout in milliseconds after which the toast is closed. Set to -1 to have a persistent toast.
	 */
	timeout?: number

	/**
	 * Set to true to allow HTML content inside of the toast text
	 * @default false
	 */
	isHTML?: boolean

	/**
	 * Set a type of {ToastType} to style the modal
	 */
	type?: ToastType

	/**
	 * Provide a function that is called after the toast is removed
	 */
	onRemove?: () => void

	/**
	 * Provide a function that is called when the toast is clicked
	 */
	onClick?: () => void

	/**
	 * Make the toast closable
	 */
	close?: boolean

	/**
	 * Specify the element to attach the toast element to (for testing)
	 */
	selector?: string

	/**
	 * Whether the messages should be announced to screen readers.
	 * See the following docs for an explanation when to use which:
	 * https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/ARIA_Live_Regions
	 *
	 * By default, errors are announced assertive and other messages "polite".
	 */
	ariaLive?: ToastAriaLive
}

/**
 * Show a toast message
 *
 * @param data Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showMessage(data: string|Node, options?: ToastOptions): Toast {
	options = Object.assign({
		timeout: TOAST_DEFAULT_TIMEOUT,
		isHTML: false,
		type: undefined,
		// An undefined selector defaults to the body element
		selector: undefined,
		onRemove: () => { },
		onClick: undefined,
		close: true,
	}, options)

	if (typeof data === 'string' && !options.isHTML) {
		// fime mae sure that text is extracted
		const element = document.createElement('div')
		element.innerHTML = data
		data = element.innerText
	}
	let classes = options.type ?? ''

	if (typeof options.onClick === 'function') {
		classes += ' toast-with-click '
	}

	const isNode = data instanceof Node

	let ariaLive: ToastAriaLive = ToastAriaLive.POLITE
	if (options.ariaLive) {
		ariaLive = options.ariaLive
	} else if (options.type === ToastType.ERROR || options.type === ToastType.UNDO) {
		ariaLive = ToastAriaLive.ASSERTIVE
	}

	const toast = Toastify({
		[!isNode ? 'text' : 'node']: data,
		duration: options.timeout,
		callback: options.onRemove,
		onClick: options.onClick,
		close: options.close,
		gravity: 'top',
		selector: options.selector,
		position: 'right',
		backgroundColor: '',
		className: 'dialogs ' + classes,
		escapeMarkup: !options.isHTML,
		ariaLive,
	})

	toast.showToast()

	return toast
}

/**
 * Show a toast message with error styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showError(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.ERROR })
}

/**
 * Show a toast message with warning styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showWarning(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.WARNING })
}

/**
 * Show a toast message with info styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showInfo(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.INFO })
}

/**
 * Show a toast message with success styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showSuccess(text: string, options?: ToastOptions): Toast {
	return showMessage(text, { ...options, type: ToastType.SUCCESS })
}

/**
 * Show a toast message with a loading spinner
 * The toast will be shown permanently and needs to be hidden manually by calling hideToast()
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param options
 */
export function showLoading(text: string, options?: ToastOptions): Toast {
	// Generate loader svg
	const loader = document.createElement('span')
	loader.innerHTML = LoaderSvg
	loader.classList.add('toast-loader')

	// Generate loader layout
	const loaderContent = document.createElement('span')
	loaderContent.classList.add('toast-loader-container')
	loaderContent.innerText = text
	loaderContent.appendChild(loader)

	return showMessage(loaderContent, {
		...options,
		close: false,
		timeout: TOAST_PERMANENT_TIMEOUT,
		type: ToastType.LOADING,
	})
}

/**
 * Show a toast message with undo styling
 *
 * @param text Message to be shown in the toast, any HTML is removed by default
 * @param onUndo Function that is called when the undo button is clicked
 * @param options
 */
export function showUndo(text: string, onUndo: (e: MouseEvent) => void, options?: ToastOptions): Toast {
	// onUndo callback is mandatory
	if (!(onUndo instanceof Function)) {
		throw new Error('Please provide a valid onUndo method')
	}

	let toast: Toast

	options = Object.assign(options || {}, {
		// force 10 seconds of timeout
		timeout: TOAST_UNDO_TIMEOUT,
		// remove close button
		close: false,
	})

	// Generate undo layout
	const undoContent = document.createElement('span')
	const undoButton = document.createElement('button')
	undoContent.classList.add('toast-undo-container')
	undoButton.classList.add('toast-undo-button')
	undoButton.innerText = t('Undo')
	undoContent.innerText = text
	undoContent.appendChild(undoButton)

	undoButton.addEventListener('click', function(event) {
		event.stopPropagation()
		onUndo(event)

		// Hide toast
		if (toast?.hideToast instanceof Function) {
			toast.hideToast()
		}
	})

	toast = showMessage(undoContent, { ...options, type: ToastType.UNDO })
	return toast
}
