<script>
	const features = [
		{
			title: 'Zero Config Setup',
			description:
				'Just drop it in and get insights. No complicated configuration files or environments to set up.',
			icon: 'M5 13l4 4L19 7',
		},
		{
			title: 'Lightweight & Fast',
			description:
				'No unnecessary overhead. Logdash is designed to be minimal while providing powerful observability stack.',
			icon: 'M13 10V3L4 14h7v7l9-11h-7z',
		},
		{
			title: 'Works for Any Project',
			description:
				'Use it for weekend hacks or serious builds. Logdash scales with your needs without changing your workflow.',
			icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
		},
	];
</script>

<section id="why-logdash" class="">
	<div class="container mx-auto px-4">
		<div class="mb-12 text-center">
			<h2 class="mb-2 text-3xl font-bold md:text-4xl">
				Why Engineers Love Logdash
			</h2>
			<p class="mx-auto max-w-3xl text-xl opacity-80">
				Designed by developers, for developers. Simple, powerful
				platform that gets out of your way.
			</p>
		</div>

		<div class="mx-auto flex max-w-3xl flex-col gap-6">
			{#each features as feature}
				<div class="card shadow-xl">
					<div class="card-body flex flex-row items-start gap-6">
						<div
							class="text-success bg-base-200 border-base-100/50 flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full border"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								class="h-7 w-7"
								fill="none"
								viewBox="0 0 24 24"
								stroke="currentColor"
							>
								<path
									stroke-linecap="round"
									stroke-linejoin="round"
									stroke-width="2"
									d={feature.icon}
								/>
							</svg>
						</div>
						<div class="text-left">
							<h3 class="card-title mb-1 text-xl">
								{feature.title}
							</h3>
							<p class="text-lg opacity-75">
								{feature.description}
							</p>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>
