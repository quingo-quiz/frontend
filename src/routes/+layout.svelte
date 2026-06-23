<script lang="ts">
	import '../app.css'; // Глобальные стили
	import ToastContainer from '$lib/components/ui/ToastContainer.svelte'; // Глобальные тосты
	import favicon from '$lib/assets/favicon.svg'; // тот же логотип, что в хедере
	import { onMount } from 'svelte';
	import { authService } from '$lib/api/auth';
	import { userContext } from '$lib/runes/user.svelte';
	import { securityContext } from '$lib/runes/security.svelte';

	let { children } = $props();

	// Единая точка инициализации состояния аутентификации для ВСЕХ роутов
	// (публичных, защищённых и страницы входа). Без редиректов — их выполняют
	// сами группы роутов и страница /auth, исходя из бизнес-логики.
	onMount(async () => {
		try {
			const user = await authService.fetchUserInfo();
			userContext.set(user);

			if (user) {
				await securityContext.refreshStatus();
			} else {
				securityContext.set(null);
			}
		} catch {
			userContext.set(null);
			securityContext.set(null);
		}
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<!-- Дефолтный заголовок; страницы переопределяют своим <title> -->
	<title>Quingo</title>
	<meta name="description" content="Quingo — платформа для создания и проведения квизов." />
</svelte:head>

<ToastContainer />
{@render children()}
