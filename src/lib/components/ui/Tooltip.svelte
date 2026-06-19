<script lang="ts">
	import type { Snippet } from 'svelte';
	import { cn } from '$lib/utils/ui';

	interface Props {
		/** Триггер — элемент, на который наводят / нажимают. */
		children: Snippet;
		/** Простой текст подсказки (если не передан panel). */
		content?: string;
		/** Богатое содержимое подсказки (можно с кнопками). Имеет приоритет над content. */
		panel?: Snippet;
		/** Сторона появления. */
		placement?: 'top' | 'bottom';
		/** Ширина панели в tailwind-классах, напр. 'w-64'. */
		width?: string;
		class?: string;
	}

	let { children, content, panel, placement = 'top', width = 'w-max max-w-xs', class: cls }: Props = $props();

	let open = $state(false);
	let wrap = $state<HTMLElement>();

	// Закрытие по клику вне и по Escape (для тач-режима)
	$effect(() => {
		if (!open) return;
		function onDoc(e: MouseEvent) {
			if (wrap && !wrap.contains(e.target as Node)) open = false;
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === 'Escape') open = false;
		}
		document.addEventListener('click', onDoc);
		document.addEventListener('keydown', onKey);
		return () => {
			document.removeEventListener('click', onDoc);
			document.removeEventListener('keydown', onKey);
		};
	});
</script>

<span
	bind:this={wrap}
	role="group"
	class={cn('relative inline-flex', cls)}
	onmouseenter={() => (open = true)}
	onmouseleave={() => (open = false)}
>
	<button
		type="button"
		class="inline-flex cursor-help items-center"
		aria-label={content}
		onclick={(e) => { e.stopPropagation(); open = !open; }}
	>
		{@render children()}
	</button>

	{#if open}
		<!-- pb/pt создают «мостик» без зазора, чтобы курсор мог дойти до панели, не закрыв её -->
		<span
			role="tooltip"
			class={cn(
				'absolute left-1/2 z-[1100] -translate-x-1/2',
				placement === 'top' ? 'bottom-full pb-2' : 'top-full pt-2'
			)}
		>
			<span class={cn('block rounded-xl border border-white/10 bg-slate-900 p-3 text-left text-xs leading-relaxed text-slate-200 shadow-2xl', width)}>
				{#if panel}{@render panel()}{:else}{content}{/if}
			</span>
		</span>
	{/if}
</span>
