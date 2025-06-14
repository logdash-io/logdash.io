<script lang="ts">
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	onMount(() => {
		if (page.url.pathname.startsWith('/error')) {
			return;
		}

		goto(`/error?status=${page.status}&message=${page.error.message}`);
	});
</script>
