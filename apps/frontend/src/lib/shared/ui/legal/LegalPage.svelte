<script lang="ts">
	import Logo from '$lib/shared/icons/Logo.svelte';
	import LegalDocument from '$lib/shared/ui/legal/LegalDocument.svelte';
	import type { LegalDocumentDefinition } from './LegalDocumentDefinition';

	type Props = {
		definition: LegalDocumentDefinition;
		title: string;
	};
	const { definition, title }: Props = $props();
</script>

<svelte:head>
	<title>{title} | logdash</title>
</svelte:head>

<div
	class="bg-base-300 absolute mx-auto h-full w-full overflow-auto p-2 lg:py-8"
>
	<div class="ld-modal relative mx-auto flex max-w-4xl flex-col gap-4">
		<div class="flex items-center justify-center gap-4">
			<Logo class="h-14 w-14" />

			<h1 class="text-center text-2xl font-semibold lg:text-3xl">
				{title}
			</h1>
		</div>

		<LegalDocument {definition} />
	</div>
</div>
