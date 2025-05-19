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

		if (duration > 0) {
			setTimeout(() => {
				this.remove(id);
			}, duration);
		}
	}

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

	public remove(id: string) {
		this.toasts = this.toasts.filter((toast) => toast.id !== id);
	}

	public clear() {
		this.toasts = [];
	}
}

export const toast = new ToastManager();
