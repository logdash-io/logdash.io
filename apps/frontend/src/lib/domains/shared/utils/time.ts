export function minToMs(minutes: number) {
	return minutes * 60 * 1000;
}

export function sleep(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
