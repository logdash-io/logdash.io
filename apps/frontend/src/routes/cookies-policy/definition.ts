import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';

export const cookiesPolicyDefinition: LegalDocumentDefinition = [
	{
		title: 'General remarks',
		paragraphs: [
			'This Cookies Policy is directed to Users and defines the use of cookies (the "Cookies") by the Controller.',
			"Cookies are placed on the User's end device.",
			'The Controller processes the information contained in Cookies, while as regards the collection of information on Users, only anonymous data is collected in an aggregated form, which does not include any personal data.',
			"Cookies are informational data, including text files, which are stored on the User's end device. These files are intended for the use of the Platform and the Service. In general, they contain the name and address of the website they come from, a unique number and the duration of storage on the User's end device.",
			"Detailed information on the options and methods of using Cookies is available in the settings of your Internet browser. The Controller hereby informs the User that it is possible to configure the Internet browser in a manner which prevents the storage of Cookies on the User's end device.",
			'The Controller hereby informs that Cookies may be deleted by the User after they have been placed by the Controller, by means of the appropriate functions of the Internet browser, programs designed for this purpose or by using the appropriate tools available within the operating system used by the User.',
			'A banner is displayed to the User indicating the types of Cookies used by the Platform or the Service. The User consents to the storage of, and access to, Cookies by the Controller by continuing to use the Platform or the Website after such banner is displayed.',
			'The Cookies are used for the following purposes:',
			'a) to create statistics which help us to understand how Users use the Platform or Service, so that we can improve them;',
			'b) noting and responding to potential errors (ensuring the correct functioning of the Platform or Service);',
			"c) adapting the content of the Platform or the Service to the User's preferences and optimising the use of the Platform or the Service.",
		],
	},
	{
		title: 'Types of cookies',
		list: [
			{
				title: 'The following Cookies are used on the Platform and on the Service:',
				list: [
					"a) session Cookies, which are temporary files and are stored on the User's end device until the User leaves the Platform or Service or the software (web browser) is switched off,",
					"b) permanent Cookies, which are stored on the User's end device for the time specified in the parameters of the Cookies or until they are deleted by the User.",
				],
			},
			{
				title: 'The following types of cookies are used within this Platform or Service:',
				list: [
					'a) "necessary" Cookies enabling the use of functions available on the Platform or the Service, for example: authentication Cookies used for services requiring authentication on the Platform or the Service;',
					'b) Cookies for providing security, for example: Cookies used for detecting misuse of authentication on the Platform or the Service;',
					'c) "performance" Cookies, enabling the collection of information about the use of the Platform or the Service;',
					'd) "functional" Cookies, enabling "memorisation" of the User\'s chosen settings.',
				],
			},
			{
				title: 'The Controller hereby informs the User that it uses Google Analytics to collect and analyse aggregated information on the use of the Platform or the Service.',
			},
			{
				title: "In many instances, the web browser software (Internet browser) allows Cookies to be stored on the User's end device by default. Users may change their settings regarding Cookies at any time. These settings can be changed, in particular, in such a way as to: block the automatic handling of Cookies in the settings of the Internet browser, notify the User each time Cookies are placed on the User's device or delete Cookies previously placed on the User's device. Detailed information on the possibility and methods of using Cookies is available in the settings of your web browser.",
			},
			{
				title: 'The Controller hereby informs that restrictions on the use of Cookies may affect certain functionalities available on the Platform or the Website.',
			},
		],
	},
];
