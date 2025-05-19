export type ToastType = 'info' | 'success' | 'warning' | 'error';

export interface Toast {
	id: string;
	message: string;
	type: ToastType;
	duration: number;
	timestamp: number;
}

const DEFAULT_DURATION = 5000;

class ToastManager {
	private toasts = $state<Toast[]>([]);

	public activeToasts = $derived(
		this.toasts.slice().sort((a, b) => a.timestamp - b.timestamp),
	);

	// Helper method to add a toast
	private addToast(message: string, type: ToastType, duration: number) {
		const id = crypto.randomUUID();
		const newToast: Toast = {
			id,
			message,
			type,
			duration,
			timestamp: Date.now(),
		};

		this.toasts.push(newToast);

		// Set up automatic removal after duration
		if (duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, duration);
		}
	}

	// Public methods
	public info(message: string, duration = DEFAULT_DURATION) {
		this.addToast(message, 'info', duration);
	}

	public success(message: string, duration = DEFAULT_DURATION) {
		this.addToast(message, 'success', duration);
	}

	public warning(message: string, duration = DEFAULT_DURATION) {
		this.addToast(message, 'warning', duration);
	}

	public error(message: string, duration = DEFAULT_DURATION) {
		this.addToast(message, 'error', duration);
	}

	// Allow manual removal of a toast by id
	public remove(id: string) {
		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}

	// Clear all toasts
	public clear() {
		this.toasts = [];
	}
}

// Create and export a singleton instance
export const toast = new ToastManager();
