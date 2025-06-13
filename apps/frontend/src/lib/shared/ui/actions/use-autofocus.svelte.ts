export interface AutoFocusOptions {
	/**
	 * Delay in milliseconds before focusing
	 * @default 0
	 */
	delay?: number;

	/**
	 * Whether to select all text in the input when focusing
	 * @default false
	 */
	selectAll?: boolean;

	/**
	 * Whether to prevent default scroll behavior when focusing
	 * @default false
	 */
	preventScroll?: boolean;
}

/**
 * A Svelte 5 compatible action that automatically focuses an element when it's mounted
 * or when the options change.
 *
 * @param node - The HTML element to focus
 * @param options - Configuration options for the autofocus behavior
 */
export function autoFocus(node: HTMLElement, options: AutoFocusOptions = {}) {
	let timeoutId: ReturnType<typeof setTimeout> | null = null;

	function focus() {
		// Clear any existing timeout
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
		}

		const delay = options.delay ?? 0;

		if (delay > 0) {
			timeoutId = setTimeout(() => performFocus(), delay);
		} else {
			performFocus();
		}
	}

	function performFocus() {
		// Check if the element is still in the DOM and can be focused
		if (!node.isConnected || !node.offsetParent) return;

		try {
			// Focus the element
			node.focus({
				preventScroll: options.preventScroll ?? false,
			});

			// Select all text if it's an input/textarea and selectAll is enabled
			if (
				options.selectAll &&
				(node instanceof HTMLInputElement ||
					node instanceof HTMLTextAreaElement)
			) {
				node.select();
			}
		} catch (error) {
			// Silently handle any focus errors (element might not be focusable)
			console.warn('AutoFocus action: Failed to focus element', error);
		}
	}

	function cleanup() {
		if (timeoutId !== null) {
			clearTimeout(timeoutId);
			timeoutId = null;
		}
	}

	// Use Svelte 5's $effect to handle the focus behavior
	$effect(() => {
		focus();

		// Cleanup function
		return cleanup;
	});

	// Return the action interface for Svelte
	return {
		update(newOptions: AutoFocusOptions = {}) {
			// Update the options reference
			Object.assign(options, newOptions);

			// Re-focus with updated options
			focus();
		},

		destroy() {
			cleanup();
		},
	};
}
