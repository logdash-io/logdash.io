const sleep = (ms: number): Promise<void> =>
	new Promise((resolve) => setTimeout(resolve, ms));

export const load = (): {
	anonymousProject: Promise<void>;
} => {
	return {
		anonymousProject: sleep(0),
	};
};
