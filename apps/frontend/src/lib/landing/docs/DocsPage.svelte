<script lang="ts">
	import { intersect } from '$lib/shared/ui/actions/use-intersect.svelte';
	import { onMount } from 'svelte';
	import {
		generalDocs,
		sdkDocs,
		tableTitles,
		type TableType,
	} from './docs.data';
	import { writable, derived } from 'svelte/store';

	// Centralized stores for section visibility tracking
	const visibleSections = writable<Map<string, number>>(new Map());
	const visibleSubsections = writable<Map<string, number>>(new Map());

	// Derived stores for active sections based on visibility scores
	const activeSection = derived(visibleSections, ($visibleSections) => {
		let highestScore = 0;
		let mostVisibleSection = 'general';

		for (const [section, score] of $visibleSections.entries()) {
			if (score > highestScore) {
				highestScore = score;
				mostVisibleSection = section;
			}
		}

		return mostVisibleSection;
	});

	const activeSubSection = derived(
		[visibleSubsections, activeSection],
		([$visibleSubsections, $activeSection]) => {
			let highestScore = 0;
			let mostVisibleSubsection = 'rate-limiting'; // Default

			for (const [subsectionId, score] of $visibleSubsections.entries()) {
				// Only consider subsections of the active section
				if (
					subsectionId.startsWith($activeSection) ||
					$activeSection === 'general'
				) {
					if (score > highestScore) {
						highestScore = score;
						mostVisibleSubsection = subsectionId;
					}
				}
			}

			return mostVisibleSubsection;
		},
	);

	// Helper to update visibility scores
	function updateVisibility(
		id: string,
		isIntersecting: boolean,
		ratio: number,
		isSubsection: boolean = false,
	) {
		const store = isSubsection ? visibleSubsections : visibleSections;

		store.update((map) => {
			if (isIntersecting) {
				// Visibility score is based on the intersection ratio
				map.set(id, ratio * 100);
			} else {
				// If no longer intersecting, set to 0 but don't remove
				// to avoid jumpiness
				map.set(id, 0);
			}
			return map;
		});
	}

	const sections = [
		{
			id: 'general',
			title: 'General Documentation',
			subsections: generalDocs,
		},
		{
			id: 'sdks',
			title: 'SDK Documentation',
			subsections: sdkDocs,
		},
	];

	onMount(() => {
		sections.forEach((section) => {
			visibleSections.update((map) => {
				if (!map.has(section.id)) map.set(section.id, 0);
				return map;
			});

			section.subsections.forEach((subsection) => {
				visibleSubsections.update((map) => {
					if (!map.has(subsection.id)) map.set(subsection.id, 0);
					return map;
				});
			});
		});
	});
</script>

<div class="mx-auto flex w-full max-w-4xl gap-8 px-8 py-8 sm:px-0">
	<div
		class="sticky top-32 hidden h-fit max-h-[calc(100vh-5rem)] shrink-0 overflow-y-auto sm:block"
	>
		<ul class="menu menu-compact p-0">
			{#each sections as section}
				<li>
					<div
						class={$activeSection === section.id
							? 'active font-semibold'
							: ''}
					>
						<a href={`#${section.id}`}>{section.title}</a>
					</div>
					<ul class="pl-4">
						{#each section.subsections as subsection}
							<li>
								<a
									href={`#${subsection.id}`}
									class={$activeSubSection === subsection.id
										? 'active text-primary'
										: ''}
								>
									{subsection.title}
								</a>
							</li>
						{/each}
					</ul>
				</li>
			{/each}
		</ul>
	</div>

	<div class="flex-1">
		{#each sections as section}
			<section
				id={section.id}
				class="mb-12"
				use:intersect={{
					rootMargin: '-100px 0px -50% 0px',
					threshold: [
						0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0,
					],
					callback: ({ isIntersecting, intersectionRatio }) => {
						updateVisibility(
							section.id,
							isIntersecting,
							intersectionRatio,
						);
					},
				}}
			>
				<h1 class="mb-6 text-3xl font-bold">{section.title}</h1>

				{#each section.subsections as subsection}
					{#if subsection.type === 'general'}
						<section
							id={subsection.id}
							class="mb-8"
							use:intersect={{
								rootMargin: '10px',
								threshold: [
									0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
									0.9, 1.0,
								],
								callback: ({
									isIntersecting,
									intersectionRatio,
								}) => {
									updateVisibility(
										subsection.id,
										isIntersecting,
										intersectionRatio,
										true,
									);
								},
							}}
						>
							<h2 class="mb-4 text-2xl font-semibold">
								{subsection.title}
							</h2>
							<div
								class="prose mb-6 max-w-none whitespace-pre-wrap"
							>
								<p>{subsection.intro}</p>
							</div>

							{#if subsection.tables}
								{#each Object.entries(subsection.tables) as [tableKey, tableData]}
									<h3 class="mb-3 text-xl font-semibold">
										{tableTitles[tableKey as TableType] ||
											tableKey}
									</h3>

									{#if tableKey === 'compression'}
										<div class="prose mb-4 max-w-none">
											<p>
												For improved performance, we
												recommend compressing payloads
												using gzip. Set the <code>
													Content-Encoding: gzip
												</code>
												header when sending compressed data.
											</p>
										</div>
									{/if}

									<div class="mb-6 overflow-x-auto">
										<table class="table-zebra table w-full">
											<thead>
												<tr>
													{#each tableData.headers as header}
														<th>{header}</th>
													{/each}
												</tr>
											</thead>
											<tbody>
												{#each tableData.rows as row}
													<tr>
														{#each row as cell, cellIndex}
															<td>
																{@html cellIndex ===
																	0 &&
																tableKey ===
																	'headers'
																	? `<code>${cell}</code>`
																	: cell}
															</td>
														{/each}
													</tr>
												{/each}
											</tbody>
										</table>
									</div>
								{/each}
							{/if}
						</section>
					{:else}
						<section
							id={subsection.id}
							class="mb-20"
							use:intersect={{
								rootMargin: '10px',
								threshold: [
									0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8,
									0.9, 1.0,
								],
								callback: ({
									isIntersecting,
									intersectionRatio,
								}) => {
									updateVisibility(
										subsection.id,
										isIntersecting,
										intersectionRatio,
										true,
									);
								},
							}}
						>
							<h2 class="mb-4 text-2xl font-semibold">
								{subsection.title}
							</h2>

							<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
								{#each subsection.sections as sdkSection}
									<a
										href={`${subsection.docsPath}${sdkSection.path}`}
										target="_blank"
										class="ld-card shadow-md transition-shadow hover:shadow-lg"
									>
										<h3 class="card-title">
											{sdkSection.title}
										</h3>
										<p class="text-base-content/70 text-sm">
											View {sdkSection.title} documentation
											for
											{subsection.title}
										</p>
										<div
											class="card-actions mt-4 justify-end"
										>
											<button
												class="btn btn-primary btn-sm w-full"
											>
												View Docs
											</button>
										</div>
									</a>
								{/each}
							</div>
						</section>
					{/if}
				{/each}
			</section>
		{/each}
	</div>
</div>

<style>
	:global(html) {
		scroll-behavior: smooth;
	}
	.active {
		font-weight: 500;
	}
	:global(.sticky) {
		position: -webkit-sticky;
		position: sticky;
	}
	:global(code) {
		background: hsl(var(--b3));
		padding: 0.2em 0.4em;
		border-radius: 0.3em;
		font-size: 0.9em;
	}
</style>
