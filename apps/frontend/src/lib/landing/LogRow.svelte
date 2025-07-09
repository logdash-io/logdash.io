<script lang="ts">
	import { DateTime } from 'luxon';

	type Props = {
		date: Date;
		level: string;
		message: string;
		prefix?: 'full' | 'short';
	};

	const { date: rawDate, level, message, prefix = 'full' }: Props = $props();
	const [left, right] = DateTime.fromJSDate(new Date(rawDate))
		.toLocal()
		.toISO({ includeOffset: true })
		.split('T');

	const [date, time] = $derived([left, right.split('.')[0]]);
</script>

<div class="flex items-start gap-2.5 font-mono text-sm">
	<div
		class={[
			'mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full align-middle',
			{
				'bg-[#155dfc]': level === 'info',
				'bg-[#fe9a00]': level === 'warning',
				'bg-[#e7000b]': level === 'error',
				'bg-[#00a6a6]': level === 'http',
				'bg-[#00a600]': level === 'verbose' || level === 'debug',
				'bg-[#505050]': level === 'silly',
			},
		]}
	></div>

	<div class="flex flex-col-reverse sm:flex-row sm:gap-2">
		<span class="text-base-content/60 whitespace-nowrap text-xs sm:text-sm">
			[{#if prefix === 'full'}{date} {time}{:else}{time}{/if}]
		</span>

		<span class="break-all">
			{message}
		</span>
	</div>
</div>
