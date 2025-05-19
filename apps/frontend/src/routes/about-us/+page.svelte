<script>
	import AnimatedView from '$lib/shared/ui/AnimatedView.svelte';
</script>

<AnimatedView class="mx-auto flex h-full max-w-3xl flex-col px-2">
	<div
		class="ld-card-base bg-neutral text-neutral-content rounded-xl p-8 shadow-xl"
	>
		<p
			class="mb-2 text-xs font-semibold tracking-wide uppercase opacity-80"
		>
			Founders Memo
		</p>
		<p class="mb-6 text-lg font-extrabold">Logdash Inc.</p>

		<p class="mb-4">Observability should be easy and fun.</p>

		<p class="mb-4">
			Teams struggle with fragmented tools and unclear data, wasting time
			and causing frustration. Self-hosted solutions only add complexity
			with maintenance burdens and scaling challenges. We've experienced
			these pain points firsthand.
		</p>

		<p class="mb-4">
			We've aggregated our years of expertise into a simple, powerful tool
			that eliminates the hassle of self-hosted solutions. Our platform is
			built to help you:
		</p>

		<ul class="mb-4 list-inside list-disc">
			<li>Gain clarity and confidence in your systems</li>
			<li>Resolve issues faster with actionable insights</li>
			<li>Focus on building, not debugging</li>
		</ul>

		<p class="mb-6">
			If you're ready to leave behind the noise, enterprise-first
			cluttered observability tools and self-hosted headaches, Logdash is
			here for you.
		</p>

		<div
			class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8"
		>
			<div class="flex items-center gap-4">
				<img
					src="/images/founders/olo.webp"
					alt="Founder 1"
					class="h-12 w-12 rounded-full"
				/>
				<div class="text-left">
					<p class="font-medium">Aleksander Blaszkiewicz</p>
					<p class="text-sm">Co-founder</p>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<img
					src="/images/founders/szymeo.webp"
					alt="Founder 2"
					class="h-12 w-12 rounded-full"
				/>
				<div class="text-left">
					<p class="font-medium">Szymon Gracki</p>
					<p class="text-sm">Co-founder</p>
				</div>
			</div>
		</div>
	</div>
</AnimatedView>
