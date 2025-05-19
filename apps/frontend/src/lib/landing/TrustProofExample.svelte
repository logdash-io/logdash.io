<script lang="ts">
	import TrustProof from './TrustProof.svelte';
</script>

<section class="container mx-auto px-4">
	<h2 class="text-secondary mb-12 text-center text-3xl font-bold">
		What Engineers say about Logdash
	</h2>

	<div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
		<div class="card ld-card p-6">
			<TrustProof
				quote="Logs appear instantly—no lag, no waiting. The real-time speed is unmatched."
				person="Maciej Kulon"
				company={{
					who: 'Director Of Engineering',
					name: 'Flip',
					url: 'https://flip.shop?ref=logdash.io',
				}}
				img="/images/testimonials/maciej_k.webp"
			/>
		</div>
		<div class="card ld-card p-6">
			<TrustProof
				quote="I had it running in minutes. Installed it, and boom—logs started flowing instantly."
				person="Bartosz Świtalski"
				company={{
					who: 'Software Engineer',
					name: 'Box',
					url: 'https://box.com?ref=logdash.io',
				}}
				img="/images/testimonials/bsw.webp"
			/>
		</div>
		<div class="card ld-card p-6">
			<TrustProof
				quote="Lightweight, powerful, and fast. The best parts of many tools, without the clutter."
				person="Jerzy Wiśniewski"
				company={{
					who: 'Software Engineer',
					name: 'Megaron',
					url: 'https://megaron.com.pl/?ref=logdash.io',
				}}
				img="/images/testimonials/bialyjurek.webp"
			/>
		</div>
	</div>
</section>
