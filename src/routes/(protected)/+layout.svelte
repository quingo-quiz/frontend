<!-- Защищённая группа роутов: требует авторизации.
     Мои квизы, редактор, собственный профиль, настройки.
     Незалогиненных уводим на /auth с запоминанием целевого пути. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';
	import { userContext } from '$lib/runes/user.svelte';
	import { securityContext } from '$lib/runes/security.svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';

	let { children } = $props();

	// Пока идёт первичная загрузка состояния — держим заглушку, чтобы не мигнуть
	// контентом до проверки и не дёрнуть редирект раньше времени.
	let isResolving = $derived(
		userContext.isLoading || (userContext.isAuthenticated && securityContext.isLoading)
	);

	$effect(() => {
		if (!userContext.isLoading && !userContext.isAuthenticated) {
			const target = $page.url.pathname + $page.url.search;
			goto(`/auth?redirect=${encodeURIComponent(target)}`);
		}
	});
</script>

{#if isResolving}
	<div class="flex min-h-dvh items-center justify-center bg-background text-primary">
		<span class="animate-pulse text-xl font-bold">Loading...</span>
	</div>
{:else if userContext.isAuthenticated}
	<AppShell>
		{@render children()}
	</AppShell>
{/if}
