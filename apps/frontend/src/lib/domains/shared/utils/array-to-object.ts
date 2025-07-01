export const arrayToObject = <T>(array: T[], key: keyof T) =>
	array.reduce((obj, item) => {
		obj[item[key as string]] = item;
		return obj;
	}, {});
