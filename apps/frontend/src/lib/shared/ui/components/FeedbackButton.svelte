<script lang="ts">
	import { GiftIcon } from 'lucide-svelte';
	import type { PostHog } from 'posthog-js';

	let message = $state('');
	let open = $state(false);
	let rating = $state(5);
	// svelte-ignore non_reactive_update
	let textarea: HTMLTextAreaElement | null = null;

	const captureFeedback = () => {
		const pg: PostHog = window['posthog'];
		pg.capture('feedback_collected', {
			message,
			rating,
		});
		message = '';
	};

	$effect(() => {
		if (open) {
			textarea.focus();
		}
	});
</script>

<div class="fixed right-4 bottom-4 z-50">
	<div class="relative">
		<button
			onclick={() => {
				open = !open;
			}}
			class="btn btn-outline btn-md border-primary bg-base-300"
			data-posthog-id="share-feedback-button"
		>
			<GiftIcon class="h-5 w-5" />
			Share Feedback
		</button>

		{#if open}
			<div
				class="ld-card-base focus-within:ring-primary absolute right-0 bottom-12 flex h-52 w-72 flex-col rounded-xl ring ring-transparent"
			>
				<textarea
					bind:this={textarea}
					class="h-full w-full resize-none rounded-xl border-none p-4 text-base outline-0"
					placeholder="How could we improve Logdash?"
					autofocus
					bind:value={message}
				></textarea>

				<div class="flex items-center justify-end gap-2 p-2">
					<div class="rating rating-sm mx-auto gap-0.5">
						<input
							type="radio"
							name="rating-2"
							class="mask mask-star-2 bg-primary"
							aria-label="1 star"
							onclick={() => (rating = 1)}
							checked={rating === 1}
						/>
						<input
							type="radio"
							name="rating-2"
							class="mask mask-star-2 bg-primary"
							aria-label="2 star"
							onclick={() => (rating = 2)}
							checked={rating === 2}
						/>
						<input
							type="radio"
							name="rating-2"
							class="mask mask-star-2 bg-primary"
							aria-label="3 star"
							onclick={() => (rating = 3)}
							checked={rating === 3}
						/>
						<input
							type="radio"
							name="rating-2"
							class="mask mask-star-2 bg-primary"
							aria-label="4 star"
							onclick={() => (rating = 4)}
							checked={rating === 4}
						/>
						<input
							type="radio"
							name="rating-2"
							class="mask mask-star-2 bg-primary"
							aria-label="5 star"
							onclick={() => (rating = 5)}
							checked={rating === 5}
						/>
					</div>

					<button
						class="btn btn-sm btn-secondary"
						onclick={() => (open = false)}
					>
						Cancel
					</button>

					<button
						onclick={() => {
							captureFeedback();
							open = false;
						}}
						class="btn btn-sm btn-primary"
					>
						Send
					</button>
				</div>
			</div>
		{/if}
	</div>
</div>
