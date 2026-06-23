<!-- Публичная группа роутов: доступна без авторизации.
     Главная, каталог и публичные профили юзеров. -->
<script lang="ts">
	import AppShell from '$lib/components/layout/AppShell.svelte';

	let { children } = $props();
</script>

<AppShell>
	{@render children()}
</AppShell>
