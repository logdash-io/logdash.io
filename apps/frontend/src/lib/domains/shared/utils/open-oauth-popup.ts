type Options = {
	sameDomain?: boolean;
};

export const openOAuthPopup = (
	url: string,
	options: Options = {},
): Promise<string> => {
	return new Promise((resolve, reject) => {
		const width = 600;
		const height = 600;
		const left = window.screen.width / 2 - width / 2;
		const top = window.screen.height / 2 - height / 2;

		const popup = window.open(
			url,
			'OAuth',
			`toolbar=no, location=no, directories=no, status=no, menubar=no, 
	  scrollbars=no, resizable=no, copyhistory=no, width=${width}, 
	  height=${height}, top=${top}, left=${left}`,
		);

		if (!popup) {
			reject(new Error('Failed to open popup'));
			return;
		}

		const interval = setInterval(() => {
			if (popup.closed) {
				clearInterval(interval);
				reject(new Error('User closed popup'));
				return;
			}

			try {
				const sameDomainCondition = options.sameDomain
					? popup.location.origin === window.location.origin
					: true;

				if (sameDomainCondition) {
					clearInterval(interval);
					popup.close();
					resolve(popup.location.pathname);
				}
			} catch (error) {
				// noop
			}
		}, 1000);
	});
};
