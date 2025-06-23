<script lang="ts">
	import { UserTier } from '$lib/shared/types.js';
	import { generateGithubOAuthUrl } from '$lib/shared/utils/generate-github-oauth-url.js';
	import { CheckIcon, XIcon } from 'lucide-svelte';
	import { fade } from 'svelte/transition';

	let loggingIn = $state(false);

	const handleGithubLogin = (tier: UserTier) => {
		loggingIn = true;
		window.location.href = generateGithubOAuthUrl({
			terms_accepted: false,
			email_accepted: false,
			flow: 'login',
			fallback_url: `/app/auth?needs_account=true`,
			tier,
			next_url: '/app/clusters',
		});
	};

	const pricingData = {
		header: {
			title: 'Pricing that makes sense',
			subtitle:
				"Pick a plan that's right for you and your awesome projects.",
		},
		plans: [
			{
				name: 'Hobby',
				price: 'Free',
				description:
					'Great for kicking the tires or for your personal stuff',
				features: [
					{ name: 'Up to 5 projects', included: true },
					{ name: 'Up to 2 metrics per project', included: true },
					{ name: 'Access 1,000 most recent logs', included: true },
					{ name: '1 week metrics retention', included: true },
					{
						name: 'Quick insights with short-term data granularity',
						included: true,
					},
					{ name: 'Feature requests', included: true },
					{
						name: 'Discord community',
						included: true,
					},
				],
				buttonText: 'Get started',
				tier: UserTier.FREE,
				popular: false,
			},
			{
				name: 'Early Bird',
				price: '$5',
				period: 'per month',
				description: 'Ideal for Logdash believers and early adopters. Only 7 spots available!',
				features: [
					{ name: 'Everything in Hobby, plus:', included: true },
					{ name: 'Up to 20 projects', included: true },
					{ name: 'Up to 20 http monitors', included: true },
					{ name: 'Up to 10 metrics per project', included: true },
					{
						name: 'Lifetime access to 10,000 most recent logs',
						included: true,
					},
					{ name: '1 month metrics retention', included: true },
					{
						name: 'Comprehensive insights with extended data granularity',
						included: true,
					},
					{ name: 'Priority support', included: true },
					{
						name: 'Dedicated Discord channel',
						included: true,
					},
					{
						name: 'Regular catch-up calls',
						included: true,
					},
					{
						name: 'Early access to new features',
						included: true,
					},
					{
						name: 'Priority feature requests',
						included: true,
					},
				],
				buttonText: 'Get started',
				tier: UserTier.EARLY_BIRD,
				popular: true,
			},
		],
		footer: {
			title: "Questions? We're here to help",
			description:
				'Contact us for any questions about our pricing or features',
		},
	};

	const featureComparison = {
		title: 'Detailed Feature Comparison',
		plans: [
			{ name: 'Hobby', price: 'Free', tier: 'hobby' },
			{ name: 'Early Bird', price: '$5/month', tier: 'earlyBird' }
		],
		sections: [
			{
				name: 'Projects',
				icon: '🚀',
				features: [
					{
						name: 'Projects',
						hobby: '5',
						earlyBird: 'Unlimited'
					},
					{
						name: 'Services',
						hobby: '5',
						earlyBird: '20'
					},
				]
			},
			{
				name: 'Logs',
				icon: '📊',
				features: [
					{
						name: 'Logs retention',
						hobby: '1,000 most recent logs',
						earlyBird: '10,000 most recent logs'
					},
					{
						name: "Statistics retention",
						hobby: '7 days',
						earlyBird: '30 days'
					},
					{
						name: 'Rate limit per hour',
						hobby: '10,000',
						earlyBird: '50,000'
					}
				]
			},
			{
				name: 'Metrics',
				icon: '📈',
				features: [
					{
						name: 'Metrics per service',
						hobby: '2',
						earlyBird: '10'
					},
					{
						name: 'Retention',
						hobby: '7 days',
						earlyBird: '30 days'
					},
				]
			},
			{
				name: 'Monitors',
				icon: '🔍',
				features: [
					{
						name: 'Number of monitors per service',
						hobby: '1',
						earlyBird: '1'
					},
				]
			},
			{
				name: 'Alerting',
				icon: '🚨',
				features: [
					{
						name: 'Telegram',
						hobby: true,
						earlyBird: true
					},
					{
						name: 'Email',
						hobby: false,
						earlyBird: 'Coming soon'
					},
					{
						name: 'Webhook',
						hobby: false,
						earlyBird: 'Coming soon'
					},
					{
						name: 'Discord',
						hobby: false,
						earlyBird: 'Coming soon'
					},
					{
						name: 'Slack',
						hobby: false,
						earlyBird: 'Coming soon'
					},
					{
						name: 'SMS',
						hobby: false,
						earlyBird: 'Coming soon'
					},
				]
			},
			{
				name: 'Support',
				icon: '💬',
				features: [
					{
						name: 'Dedicated discord channel',
						hobby: false,
						earlyBird: true
					},
					{
						name: 'Priority support',
						hobby: false,
						earlyBird: true
					},
					{
						name: 'Regular catch-up calls',
						hobby: false,
						earlyBird: true
					},
					{
						name: 'Early access to new features',
						hobby: false,
						earlyBird: true
					},
					{
						name: 'Feature requests',
						hobby: false,
						earlyBird: true
					},
				]
			}
		]
	};
</script>

<section class="px-4 py-8 sm:py-16">
	<div class="mx-auto max-w-4xl text-center">
		<h1 class="mb-4 text-4xl font-bold">{pricingData.header.title}</h1>
		<p class="mb-8 text-lg opacity-80">{pricingData.header.subtitle}</p>
	</div>
</section>

<section class="px-4">
	<span class="mx-auto mb-6 block max-w-2xl text-center font-semibold">
		30-days trial. If you cancel the service within 30 days, you will
		receive a full refund.
	</span>

	<div class="mx-auto mb-8 grid max-w-4xl gap-8 md:grid-cols-2">
		{#each pricingData.plans as plan}
			<div
				class="card ld-modal overflow-hidden shadow-xl {plan.popular
					? 'border-primary border-4'
					: ''}"
			>
				{#if plan.popular}
					<div class="badge badge-primary absolute right-4 top-4">
						Limited Offer -50%
					</div>
				{/if}

				<div class="card-body p-2">
					<h2 class="card-title text-2xl font-bold">
						{plan.name}
					</h2>
					<div class="mb-4 mt-2">
						<span class="text-4xl font-bold">{plan.price}</span>

						{#if plan.period}
							<span class="text-base opacity-75">
								{plan.period}
							</span>
						{/if}

						<p class="mt-2 text-sm opacity-75">
							{plan.description}
						</p>
					</div>

					<div class="divider"></div>

					<ul class="mb-8 space-y-2">
						{#each plan.features as feature}
							<li class="flex items-center gap-2">
								{#if feature.included}
									<CheckIcon
										class="text-success h-4 w-4 flex-shrink-0"
									/>
								{:else}
									<XIcon
										class="text-error h-4 w-4 flex-shrink-0"
									/>
								{/if}
								<span
									class={!feature.included
										? 'opacity-50'
										: ''}
								>
									{feature.name}
								</span>
							</li>
						{/each}
					</ul>

					<div class="card-actions mt-auto justify-center">
						<button
							onclick={() => handleGithubLogin(plan.tier)}
							disabled={loggingIn}
							class={`btn w-full ${plan.popular ? 'btn-primary' : 'btn-secondary'}`}
						>
							{#if loggingIn}
								<div
									in:fade={{ duration: 150 }}
									class="flex h-6 w-6 items-center justify-center"
								>
									<span
										class="loading loading-spinner h-4 w-4"
									></span>
								</div>
							{/if}

							{plan.buttonText}
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<span class="badge badge-ghost badge-soft mx-auto mb-8 block opacity-80">
		Plans are in beta and subject to change
	</span>

	<!-- Detailed Feature Comparison Table -->
	<div class="mx-auto max-w-6xl">
		<h2 class="mb-8 text-center text-2xl font-bold">
			{featureComparison.title}
		</h2>

		<div class="overflow-x-auto rounded-xl border border-base-300 bg-base-100 shadow-lg">
			<table class="table w-full">
				<thead>
					<tr class="border-b-2 border-base-300">
						<th class="text-left font-bold">Feature</th>
						{#each featureComparison.plans as plan}
							<th class="text-center font-bold">
								{plan.name}<br>
								<span class="text-sm font-normal opacity-75">{plan.price}</span>
							</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each featureComparison.sections as section}
						<!-- Section Header -->
						<tr class="border-b border-base-200">
							<td colspan="3" class="bg-base-200 py-3 text-sm font-semibold uppercase tracking-wider">
								{section.icon} {section.name}
							</td>
						</tr>

						<!-- Section Features -->
						{#each section.features as feature}
							<tr>
								<td class="font-medium">{feature.name}</td>
								<td class="text-center">
									{#if typeof feature.hobby === 'boolean'}
										{#if feature.hobby}
											<CheckIcon class="mx-auto h-4 w-4 text-success" />
										{:else}
											<XIcon class="mx-auto h-4 w-4 text-error" />
										{/if}
									{:else}
										{feature.hobby}
									{/if}
								</td>
								<td class="text-center">
									{#if typeof feature.earlyBird === 'boolean'}
										{#if feature.earlyBird}
											<CheckIcon class="mx-auto h-4 w-4 text-success" />
										{:else}
											<XIcon class="mx-auto h-4 w-4 text-error" />
										{/if}
									{:else}
										{feature.earlyBird}
									{/if}
								</td>
							</tr>
						{/each}
					{/each}
				</tbody>
			</table>
		</div>
	</div>

	<div
		class="ld-card-base bg-neutral text-neutral-content mx-auto max-w-2xl rounded-xl p-8 shadow-xl"
	>
		<p
			class="mb-2 text-xs font-semibold uppercase tracking-wide opacity-80"
		>
			A Note from us
		</p>
		<p class="mb-6 text-lg font-extrabold">Logdash Inc.</p>

		<p class="mb-4 opacity-90">
			Our pricing is designed to let you explore all of the Logdash
			features and capabilities without paying a dime.
		</p>

		<p class="mb-4 opacity-90">
			We believe that the best way to help with your success is to give
			you access to everything we have to offer, even before you decide to
			upgrade.
		</p>

		<p class="mb-4 opacity-90">
			Focus on building your awesome projects; your access to all features
			is only limited by fair resource usage on our side.
		</p>

		<p class="mb-6 opacity-90">
			We're committed to transparency and fairness as we grow. Thanks for
			joining our journey!
		</p>

		<div
			class="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-8"
		>
			<div class="flex items-center gap-4">
				<img
					src="/images/founders/olo.webp"
					alt="Aleksander Blaszkiewicz"
					class="h-12 w-12 rounded-full"
				/>
				<div class="text-left">
					<p class="font-medium">Aleksander Blaszkiewicz</p>
					<p class="text-sm opacity-75">Co-founder</p>
				</div>
			</div>

			<div class="flex items-center gap-4">
				<img
					src="/images/founders/szymeo.webp"
					alt="Szymon Gracki"
					class="h-12 w-12 rounded-full"
				/>
				<div class="text-left">
					<p class="font-medium">Szymon Gracki</p>
					<p class="text-sm opacity-75">Co-founder</p>
				</div>
			</div>
		</div>
	</div>
</section>
