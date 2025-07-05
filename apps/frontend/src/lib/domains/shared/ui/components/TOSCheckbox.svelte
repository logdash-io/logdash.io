<script lang="ts">
	let { termsAccepted = $bindable() } = $props();
</script>

<label class="label cursor-pointer space-x-1">
	<input
		type="checkbox"
		class="checkbox checkbox-primary checkbox-sm"
		bind:checked={termsAccepted}
	/>
	<span class="label-text">
		I accept
		<a href="/terms-of-service" target="_blank" class="link">
			terms of service
		</a>
	</span>
</label>
