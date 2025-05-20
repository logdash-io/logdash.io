<script>
	import { cubicInOut } from 'svelte/easing';
	import { scale } from 'svelte/transition';
</script>

<div
	in:scale={{
		duration: 300,
		start: 1.1,
		easing: cubicInOut,
	}}
	out:scale={{
		duration: 300,
		start: 1.1,
		easing: cubicInOut,
	}}
	class="bg-base-300 flex min-h-screen w-full items-center justify-center"
>
	<div class="card ld-card-base w-96 rounded-2xl shadow-xl">
		<div class="card-body items-center gap-4 p-6 text-center">
			<h2 class="card-title text-3xl font-bold">Success 🎉</h2>
			<p class="text-base-content/70">
				Thank you for your trust in our service. We'll be in touch
				shortly.
			</p>

			<div class="card-actions w-full justify-center gap-2 rounded-2xl">
				<a href="/app/clusters" class="btn btn-sm btn-primary">
					Continue
				</a>
			</div>
		</div>
	</div>
</div>
