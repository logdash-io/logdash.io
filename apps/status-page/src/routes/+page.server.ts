export const load = async (): Promise<{
	randomNumber: number;
}> => {
	return {
		randomNumber: Math.random()
	};
};
