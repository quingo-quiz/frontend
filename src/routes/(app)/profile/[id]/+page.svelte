<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { ArrowLeft } from 'lucide-svelte';
	import { profileService, type UserProfile } from '$lib/api/profile';

	const AVATAR_COLORS = [
		'bg-indigo-500',
		'bg-sky-500',
		'bg-emerald-500',
		'bg-amber-500',
		'bg-rose-500',
		'bg-purple-500',
		'bg-cyan-500',
		'bg-fuchsia-500'
	] as const;

	function hash(id: string): number {
		let h = 0;
		for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0;
		return Math.abs(h);
	}

	let profile = $state<UserProfile | null>(null);
	let isLoading = $state(true);
	let error = $state<string | null>(null);

	let userId = $derived($page.params.id ?? '');
	let avatarColor = $derived(
		profile ? AVATAR_COLORS[hash(profile.id) % AVATAR_COLORS.length] : AVATAR_COLORS[0]
	);

	onMount(async () => {
		try {
			profile = await profileService.get(userId);
		} catch {
			error = 'User not found';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>{profile?.username ?? 'Profile'} · Quingo</title>
</svelte:head>

<div class="mx-auto max-w-3xl">
	<!-- Назад -->
	<a
		href="/catalog"
		class="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-slate-300"
	>
		<ArrowLeft size={15} /> Back to catalog
	</a>

	{#if isLoading}
		<div class="rounded-[2.5rem] border border-white/5 bg-surface p-8 shadow-2xl">
			<div class="flex items-center gap-5">
				<div class="h-20 w-20 animate-pulse rounded-[1.5rem] bg-white/5"></div>
				<div class="space-y-3">
					<div class="h-5 w-40 animate-pulse rounded-full bg-white/5"></div>
					<div class="h-3 w-24 animate-pulse rounded-full bg-white/5"></div>
				</div>
			</div>
		</div>
	{:else if error || !profile}
		<div class="rounded-[2.5rem] border border-white/5 bg-surface p-12 text-center shadow-2xl">
			<p class="text-lg font-bold text-white">User not found</p>
			<p class="mt-1 text-sm text-slate-500">This profile doesn't exist or has been removed.</p>
			<a
				href="/catalog"
				class="mt-5 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 transition-colors hover:bg-white/10"
			>
				<ArrowLeft size={14} /> Go to catalog
			</a>
		</div>
	{:else}
		<div class="rounded-[2.5rem] border border-white/5 bg-surface p-6 shadow-2xl sm:p-8">
			<div class="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
				<!-- Аватар -->
				<div
					class="flex h-20 w-20 shrink-0 items-center justify-center rounded-[1.5rem] text-3xl font-bold text-white shadow-xl {avatarColor}"
				>
					{profile.username.charAt(0).toUpperCase()}
				</div>

				<div class="min-w-0 grow">
					<h1 class="text-2xl font-bold tracking-tight text-white">{profile.username}</h1>
					{#if profile.bio}
						<p class="mt-1.5 max-w-lg break-words text-sm leading-relaxed text-slate-400">
							{profile.bio}
						</p>
					{:else}
						<p class="mt-1.5 text-sm text-slate-600 italic">No bio provided.</p>
					{/if}
				</div>
			</div>
		</div>
	{/if}
</div>
