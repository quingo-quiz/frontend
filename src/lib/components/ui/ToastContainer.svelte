<script lang="ts">
	import { toasts } from '$lib/runes/toast.svelte';
	import { flip } from 'svelte/animate';
	import { fly } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { X, CheckCircle, AlertCircle, Info } from 'lucide-svelte';
	import { cn } from '$lib/utils/ui';

	// Свайп влево/вправо для закрытия тоста (удобно на мобилках, работает и мышью).
	function swipeDismiss(node: HTMLElement, onDismiss: () => void) {
		const THRESHOLD = 70;
		let startX = 0;
		let dx = 0;
		let dragging = false;
		let pointerId = 0;

		function down(e: PointerEvent) {
			// Не перехватываем нажатие на кнопку закрытия
			if ((e.target as HTMLElement).closest('button')) return;
			dragging = true;
			startX = e.clientX;
			dx = 0;
			pointerId = e.pointerId;
			try {
				node.setPointerCapture(pointerId);
			} catch {
				/* noop */
			}
			node.style.transition = 'none';
		}
		function move(e: PointerEvent) {
			if (!dragging) return;
			dx = e.clientX - startX;
			node.style.transform = `translateX(${dx}px)`;
			node.style.opacity = String(Math.max(0.2, 1 - Math.abs(dx) / 220));
		}
		function up() {
			if (!dragging) return;
			dragging = false;
			try {
				node.releasePointerCapture(pointerId);
			} catch {
				/* noop */
			}
			if (Math.abs(dx) > THRESHOLD) {
				node.dataset.swipeDir = dx > 0 ? 'right' : 'left';
				onDismiss();
			} else {
				// Возврат на место
				node.style.transition = 'transform 200ms ease, opacity 200ms ease';
				node.style.transform = '';
				node.style.opacity = '';
			}
		}

		node.addEventListener('pointerdown', down);
		node.addEventListener('pointermove', move);
		node.addEventListener('pointerup', up);
		node.addEventListener('pointercancel', up);
		return {
			update(fn: () => void) {
				onDismiss = fn;
			},
			destroy() {
				node.removeEventListener('pointerdown', down);
				node.removeEventListener('pointermove', move);
				node.removeEventListener('pointerup', up);
				node.removeEventListener('pointercancel', up);
			}
		};
	}

	// Выход: смахнутый тост улетает в сторону свайпа, остальные — вверх.
	function dismissOut(node: HTMLElement) {
		const cs = getComputedStyle(node);
		const matrix = new DOMMatrixReadOnly(cs.transform === 'none' ? '' : cs.transform);
		const startX = matrix.m41;
		const startOpacity = Number(cs.opacity) || 1;
		const dir = node.dataset.swipeDir;
		return {
			duration: dir ? 220 : 300,
			easing: cubicOut,
			css: (t: number) => {
				// t идёт 1 → 0
				if (dir) {
					const target = dir === 'right' ? window.innerWidth : -window.innerWidth;
					const x = target + t * (startX - target);
					return `transform: translateX(${x}px); opacity: ${t * startOpacity};`;
				}
				return `transform: translateY(${(t - 1) * 20}px); opacity: ${t};`;
			}
		};
	}
</script>

<!-- Позиционирование сверху по центру -->
<div
	class="fixed top-6 left-1/2 z-[2000] flex w-full max-w-[400px] -translate-x-1/2 flex-col gap-3 px-4"
>
	{#each toasts.list as toast (toast.id)}
		<div
			use:swipeDismiss={() => toasts.dismiss(toast.id)}
			animate:flip={{ duration: 200 }}
			in:fly={{ y: -20, duration: 300 }}
			out:dismissOut
			class={cn(
				'flex touch-pan-y items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md select-none',
				toast.type === 'success' && 'border-green-500/20 bg-green-500/10 text-green-400',
				toast.type === 'error' && 'border-red-500/20 bg-red-500/10 text-red-400',
				toast.type === 'info' && 'border-primary/20 bg-primary/10 text-primary'
			)}
		>
			{#if toast.type === 'success'}
				<CheckCircle size={18} class="shrink-0" />
			{/if}
			{#if toast.type === 'error'}
				<AlertCircle size={18} class="shrink-0" />
			{/if}
			{#if toast.type === 'info'}
				<Info size={18} class="shrink-0" />
			{/if}

			<p class="flex-grow text-sm leading-tight font-medium">{toast.message}</p>

			<button
				onclick={() => toasts.dismiss(toast.id)}
				aria-label="Dismiss"
				class="shrink-0 opacity-50 transition-opacity hover:opacity-100"
			>
				<X size={16} />
			</button>
		</div>
	{/each}
</div>
