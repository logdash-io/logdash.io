<script lang="ts">
	import type { Log } from '$lib/clusters/projects/domain/log';
	import { onMount } from 'svelte';
	import { FAKE_LOGS } from '../data/logs.mock';
	import LiveLogsList from '$lib/clusters/projects/ui/presentational/LiveLogsList.svelte';

	let simulatedLogs = $state<Log[]>([]);

	onMount(() => {
		let interval;
		const timeout = setTimeout(() => {
			simulatedLogs = FAKE_LOGS.map((log, index) => ({
				id: log.id,
				message: log.message,
				level: log.level,
				index,
				createdAt: new Date(log.timestamp),
			}));

			interval = setInterval(() => {
				const randomIndex = Math.floor(
					Math.random() * simulatedLogs.length,
				);
				const randomLog = simulatedLogs[randomIndex];

				simulatedLogs.push({
					id: randomLog.id,
					message: randomLog.message,
					level: randomLog.level,
					index: simulatedLogs.length,
					createdAt: new Date(),
				});
			}, 1600);
		}, 800);

		return () => {
			clearTimeout(timeout);
			clearInterval(interval);
		};
	});
</script>

<LiveLogsList logs={simulatedLogs} />
