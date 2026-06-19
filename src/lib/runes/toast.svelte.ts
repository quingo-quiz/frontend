export type ToastType = 'success' | 'error' | 'info';

interface Toast {
	id: number;
	message: string;
	type: ToastType;
}

class ToastContext {
	list = $state<Toast[]>([]);

	show(message: string, type: ToastType = 'info') {
		const id = Date.now();
		this.list.push({ id, message, type });
		setTimeout(() => this.dismiss(id), 4000);
	}

	dismiss(id: number) {
		this.list = this.list.filter((t) => t.id !== id);
	}
}

export const toasts = new ToastContext();
