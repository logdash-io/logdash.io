<script lang="ts">
	import type { User } from '$lib/shared/user/domain/user';
	import { fade } from 'svelte/transition';

	const { tier }: { tier: User['tier'] } = $props();

	let joiningTelegram = $state(false);
	const canAccess = tier === 'early-bird';
</script>

<button
	disabled={!canAccess}
	class="btn btn-sm btn-ghost justify-start"
	onclick={() => {
		joiningTelegram = true;
		fetch('/api/user/join-telegram')
			.then((res) => res.json())
			.then(({ data: url }) => {
				window.open(url, '_blank');
			})
			.finally(() => {
				joiningTelegram = false;
			});
	}}
>
	Chat with us

	{#if joiningTelegram}
		<div
			in:fade={{ duration: 150 }}
			class="flex h-4 w-4 items-center justify-center"
		>
			<span class="loading loading-sm loading-spinner"></span>
		</div>
	{:else}
		<svg
			class={[
				'h-5 w-5',
				{
					'fill-secondary': canAccess,
					'fill-secondary/30': !canAccess,
				},
			]}
			viewBox="0 0 24 24"
			id="Layer_1"
			data-name="Layer 1"
			xmlns="http://www.w3.org/2000/svg"
		>
			<g id="SVGRepo_bgCarrier" stroke-width="0"></g>
			<g
				id="SVGRepo_tracerCarrier"
				stroke-linecap="round"
				stroke-linejoin="round"
			></g>
			<g id="SVGRepo_iconCarrier">
				<title>Telegram Glyph</title>
				<path
					d="M11.99432,2a10,10,0,1,0,10,10A9.99917,9.99917,0,0,0,11.99432,2Zm3.17951,15.15247a.70547.70547,0,0,1-1.002.3515l-2.71467-2.10938L9.71484,17.002a.29969.29969,0,0,1-.285.03894l.334-2.98846.01069.00848.00683-.059s4.885-4.44751,5.084-4.637c.20147-.189.135-.23.135-.23.01147-.23053-.36152,0-.36152,0L8.16632,13.299l-2.69549-.918s-.414-.1485-.453-.475c-.041-.324.46649-.5.46649-.5l10.717-4.25751s.881-.39252.881.25751Z"
				></path>
			</g>
		</svg>
	{/if}
</button>
