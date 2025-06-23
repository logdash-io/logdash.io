import { logger } from '$lib/shared/logger/index.js';

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

  private addToast(message: string, type: ToastType, duration: number): string {
    logger.debug('Adding toast:', { message, type, duration });
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

    return id;
  }

  public info(message: string, duration = DEFAULT_DURATION) {
    const id = this.addToast(message, 'info', duration);
    return () => this.remove(id);
  }

  public success(message: string, duration = DEFAULT_DURATION) {
    logger.debug('Adding success toast:', { message, duration });
    const id = this.addToast(message, 'success', duration);
    return () => this.remove(id);
  }

  public warning(message: string, duration = DEFAULT_DURATION) {
    const id = this.addToast(message, 'warning', duration);
    return () => this.remove(id);
  }

  public error(message: string, duration = DEFAULT_DURATION) {
    const id = this.addToast(message, 'error', duration);
    return () => this.remove(id);
  }

  public remove(id: string) {
    this.toasts = this.toasts.filter((toast) => toast.id !== id);
  }

  public clear() {
    this.toasts = [];
  }
}

export const toast = new ToastManager();
