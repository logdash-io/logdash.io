export function isValidUrl(value: string): boolean {
	try {
		// If no protocol is provided, prepend https://
		const urlString =
			value.startsWith('http://') || value.startsWith('https://')
				? value
				: `https://${value}`;

		const url = new URL(urlString);

		// Check if protocol is http or https
		if (!['http:', 'https:'].includes(url.protocol)) {
			return false;
		}

		// Check if hostname has at least one dot (like .com, .org, etc) or is localhost
		if (!url.hostname.includes('.') && url.hostname !== 'localhost') {
			return false;
		}

		// Check if hostname is not just a single character
		if (url.hostname.length < 2) {
			return false;
		}

		return true;
	} catch (_) {
		return false;
	}
}

export function tryPrependProtocol(value: string): string {
	if (value.startsWith('http://') || value.startsWith('https://')) {
		return value;
	}
	return `https://${value}`;
}

export const stripProtocol = (url: string): string => {
	if (url.startsWith('http://')) {
		return url.slice(7);
	} else if (url.startsWith('https://')) {
		return url.slice(8);
	}
	return url;
};
