<!-- Общая оболочка приложения: шапка + баннер верификации + контент.
     Используется и публичной (app), и защищённой (protected) группами роутов. -->
<script lang="ts">
	import Header from '$lib/components/layout/Header.svelte';
	import EmailVerificationBanner from '$lib/components/layout/EmailVerificationBanner.svelte';

	let { children } = $props();
</script>

<div class="flex min-h-dvh flex-col">
	<Header />
	<EmailVerificationBanner />
	<main class="container mx-auto grow px-4 py-8">
		{@render children()}
	</main>
</div>
