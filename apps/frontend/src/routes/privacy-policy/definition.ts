import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';

export const PPdefinition: LegalDocumentDefinition = [
  {
    title: 'General remarks',
    paragraphs: [
      'This Privacy Policy specifies the rules for the protection and processing of personal data of users of the service in the form of a system observability platform for busy builders (the "Platform"), accessible under https://logdash.io (the "Service"), by the personal data controller - the operator of the Platform, which is Aleksander Błaszkiewicz NIP 9571167927 REGON 527410431 (the "Controller").',
      'A User is any individual using the Platform or the Service (the "User"). Where this Privacy Policy refers to Users, it shall also be understood to mean contractors who have entered into an agreement with the Controller, or any individuals representing or working with or employed by them, unless specified otherwise.',
      'The legal basis for the adoption of this document are the personal data protection regulations, in particular, the Regulation (EU) 2016/679 of the European Parliament and of the Council of 27 April 2016 on the protection of natural persons with regard to the processing of personal data and on the movement of such data, and repealing Directive 95/46/EC (the "GDPR").',
      'The Service uses cookies only to sign Users in and to make the Platform work. Its website analytics uses no cookies. Please refer to the cookies policy for details.',
    ],
  },
  {
    title: 'Personal data Controller',
    paragraphs: [
      'The controller of your personal data is Aleksander Błaszkiewicz NIP 9571167927 REGON 527410431 with its registered office at ul. Rakoczego 19 lok. 4, 80-288 Gdańsk. The controller can be contacted by e-mail at: support@logdash.io or by letter to: ul. Rakoczego 19 lok. 4, 80-288 Gdańsk.',
    ],
  },
  {
    title: 'Categories of personal data processed',
    list: [
      {
        title:
          'The User provides the Controller with the following personal data:',
        list: [
          "the User's account information (login, password and contact details provided when creating the User's account);",
          'User-generated content (all content posted on the Platform, in particular logs, insights, and analytics);',
          'payment information (information necessary to make a payment);',
          'information on the actions performed by the User (for example: creating dashboards, setting up alerts, etc.);',
          'information needed to enable additional functionalities (additional information needed to integrate with services offered by third parties);',
          'any other information provided directly by the user (providing feedback, participating in surveys, research, etc.).',
        ],
      },
      {
        title:
          'The provision of personal data is voluntary, but necessary for the Controller to provide its services.',
      },
      {
        title:
          'The Controller processes the following personal data using automated data processing:',
        list: [
          "information about the User's device (IP address, operating system information, browser information and information about device settings);",
          'information about the use of the Platform (log information related to how and when the services are used - such as pages, servers and channels visited, activities performed or content interacted with);',
          'other information collected by automated means (for example: clicks on advertisements or referral links);',
          'cookies information (described in detail within the Cookies Policy).',
        ],
      },
      {
        title:
          'The Controller shall process the personal data of the contractors, their representatives, individuals representing or cooperating with them or employed by them: name, e-mail address, telephone number (if necessary), place of employment/business address, tax identification number (if necessary) and PESEL (Polish citizens only and if necessary).',
      },
    ],
  },
  {
    title: 'Purposes of the processing of the personal data',
    list: [
      {
        title:
          "The User's personal data will be processed for the following purposes:",
        list: [
          {
            title:
              'for the purpose of the performance of the agreement, including:',
            list: [
              'to provide our services - for example: by processing logs and insights during system monitoring or storing analytics data;',
              'to be able to contact the User - for example: to verify an account being created or to enable the use of two-factor authentication security;',
              'to provide customer service - for example: to answer questions about the use of the Platform;',
            ],
          },
          {
            title:
              "for the purpose of the Controller's legitimate interests, including:",
            list: [
              'to protect the Platform - in particular to ensure security, prevent abuse and enforce compliance with the Terms and Conditions;',
              'to report on the results obtained within the Platform by the Controller - in particular for the purposes of tracking activity indicators and preparing financial reports;',
              "to personalise the Platform - in particular regarding information on other Users' activities, events and new features;",
              'to improve the Platform - in particular, to gain insight into how Users interact with the Platform and how its reception can be improved;',
              'to advertise the Platform - in particular to inform about the services and functions offered, and to verify the effectiveness of advertising;',
              'to be able to contact the User - in particular for the purpose of sending marketing communications;',
            ],
          },
          {
            title:
              'for the purpose of the fulfilment of a legal obligation incumbent on the Controller.',
            list: [],
          },
          {
            title:
              'for the purpose of the performance of the agreement; the basis for processing is Article 6 section 1 letter b) of the GDPR;',
          },
        ],
      },
    ],
  },
  {
    title: 'Website analytics and feedback',
    paragraphs: [
      'The Controller measures how the Service is used with Logdash web analytics, its own product (the "Website Analytics"). The Website Analytics sets no cookies and stores nothing in the User\'s browser to recognise the User.',
      "For each page view or other event, the Website Analytics collects the address of the page without its query string or fragment, the name of the event, the host name of the referring website, campaign (UTM) tags, the name of an advertising click identifier parameter (never its value), the browser's time zone, the User's IP address and the browser's User-Agent.",
      "From the IP address and the User-Agent, the Controller's server computes a pseudonymous visitor identifier: a SHA-256 hash of a random salt, the site, the IP address and the User-Agent. The salt is 32 random bytes created for each UTC day, held only in Redis and deleted 30 minutes after that day ends. Because the salt changes every day, so does the identifier, and once the salt is deleted nobody, the Controller included, can recompute it.",
      'The IP address is used only to compute this identifier and is never stored. Of the User-Agent, only the device type, browser and operating system are stored, and of the time zone, only the country it belongs to.',
      "When a User is signed in to the Platform, the Website Analytics also records a pseudonymous user identifier for product analytics, such as how often Users return: a SHA-256 hash of the site ID and the User's account ID, computed in the User's browser. The account ID itself is not sent to the Website Analytics.",
      'Visits are grouped into sessions on the server. A session ends after 30 minutes without activity or after 24 hours. Website Analytics data is deleted automatically after at most 365 days.',
      "Feedback the User sends from the Platform is sent to the Controller's internal Telegram chat, together with the rating the User gives and the User's e-mail address with most of it hidden (for example jo***@gm***.com).",
      "The legal basis for this processing is the Controller's legitimate interest in understanding how the Service is used and improving it (Article 6 section 1 letter f) of the GDPR).",
      'The User may object to this processing at any time. The Website Analytics does not run in a browser that sends the Global Privacy Control or Do Not Track signal, so turning on either setting in the browser stops it. The User may also object by e-mail to support@logdash.io.',
    ],
  },
  {
    title: 'Transfer of personal data - recipients',
    list: [
      {
        title: 'The recipients of your personal data are:',
        list: [
          "entities ensuring the operation and maintenance of the Controller's IT systems;",
          "the Controller's associates to whom access to your personal data is necessary to ensure the proper functioning of the Platform;",
          'entities whose services the Controller uses in connection with ensuring the correct functioning of the Platform, for example: couriers and law firms;',
          "the providers that run the Service for the Controller: Hetzner Online GmbH (servers in Germany), Cloudflare (the logdash.io web application, including the AI model that answers questions on the home page), Stripe (payments), Resend (e-mail), GitHub (sign-in and encrypted backups), Google (sign-in) and Telegram (alerts the User sets up and the Controller's internal notifications).",
        ],
      },
      {
        title:
          'The Controller shall not transfer, sell or lend collected personal data to other persons or institutions, except with the express consent or at the request of the User or at the request of authorised state authorities for the purposes of their investigations.',
      },
    ],
  },
  {
    title: 'Duration of the processing of personal data',
    list: [
      {
        title:
          'The Controller will process your personal data for the period necessary to fulfil the purpose for which these personal data were collected, namely:',
        list: [
          'if you enter into an agreement with the Controller - the Controller may process your personal data for the time necessary for the performance of the agreement and subsequently for other lawful purposes, for example: to secure possible claims during the period of limitation;',
          'where the legitimate interests of the Controller are pursued - until you object to the processing of your personal data;',
          'in the event of performance of a legal obligation incumbent on the Controller under generally applicable law - until such time as the Controller has fulfilled its obligations under the law;',
          'in the event of consent - as long as you have not withdrawn it.',
        ],
      },
      {
        title:
          'If you give your consent, the Controller shall be entitled to process your personal data even after the termination of the aforementioned agreement. The Controller will not process your personal data if you withdraw your previously given consent. The withdrawal of consent shall not affect the lawfulness of the processing of your personal data performed prior to the withdrawal of consent.',
      },
    ],
  },
  {
    title: 'Transfer of personal data outside of the EEA',
    paragraphs: [
      "Some of our service providers may store User data outside the European Economic Area. In such cases, Users' data may be stored in countries that provide an adequate level of protection for personal data, or in countries that do not provide such a level. In the latter case, the Controller secures Users' data by concluding agreements with Controller's service providers containing the so-called Standard Contractual Clauses approved by the European Commission, which provide a guarantee of adequate protection for Users' personal data in third countries, or uses other bases for the transfer of personal data. For more information in this regard, please contact us.",
    ],
  },
  {
    title: "User's rights",
    list: [
      {
        title:
          'The rights you have regarding the processing of your personal data:',
        list: [
          'the right to access information regarding what personal data is processed by the Controller and to obtain a copy of that information;',
          'the right to rectify personal data where it is inaccurate or to supplement it where it is incomplete;',
          {
            title: 'the right to erase your personal data, if:',
            list: [
              'when the personal data collected by the Controller is no longer needed by the Controller for the purposes of which you were informed;',
              'if you withdraw your consent to the processing of your personal data;',
              'insofar as the Controller is not entitled to process your data on any other legal basis;',
              'if personal data has been unlawfully processed;',
              'the need to erase personal data arises from a legal obligation of the Controller.',
            ],
          },
          'the right to data portability, meaning the right to request that the Controller send your personal data to another entity;',
          'the right to restrict the processing of your personal data, if the correctness of your data is contested by you, the processing is unlawful or the Controller no longer needs certain personal data, or when an objection to the processing is raised, you can also request that for a certain, necessary period of time (for example to verify the correctness of your personal data or to assert claims) the Controller does not perform any operations on your personal data, but only stores them;',
          'the right to object where the Controller processes your personal data for purposes arising from legitimate interests including, but not limited to, conducting marketing activities. In such an event, the Controller will stop processing your personal data immediately after you have raised an effective objection;',
          'the right to withdraw your consent applies to all consents you have given for the processing of personal data.',
        ],
      },
      {
        title: "A request for the exercise of the User's rights can be made:",
        list: [
          'in writing, by sending a letter to the address: Aleksander Błaszkiewicz, ul. Rakoczego 19 lok. 4, 80-288 Gdańsk;',
          'by sending an e-mail to an electronic mail address: support@logdash.io.',
        ],
      },
      {
        title:
          'The request specified in section 2 should indicate as precisely as possible what the request involves, in particular:',
        list: [
          'which of the rights specified in §9 section 1 above the User is seeking to exercise;',
          'what personal data processing process is the subject of the request (for example: receipt of a newsletter);',
          'which purposes of the personal data processing the request regards (for example: analytical purposes).',
        ],
      },
      {
        title:
          'If the request made is expressed in such a manner that it is not possible to determine the substance of the request or for other reasons it is not possible to comply with the request, the Controller will request additional information from the User.',
        list: [],
      },
      {
        title:
          'The request will be answered within 1 month of its receipt by the Controller. If necessary, this period may be extended by a further two months if the complexity of the request or the number of requests so requires. In the event of such an extension, the Controller shall promptly notify the sender of the request.',
        list: [],
      },
      {
        title:
          "The response will be sent to the e-mail address from which the request was sent and, with regard to requests sent to the Controller's correspondence address, by post to the address indicated on the request, unless it is clear from the content of the letter that a response to the e-mail address is preferred and if such an e-mail address is specified in the request.",
        list: [],
      },
      {
        title:
          'You have the right to file a complaint to the President of the Personal Data Protection Office (Prezes Urzędu Ochrony Danych Osobowych) if you consider that the processing of your personal data is unlawful.',
        list: [],
      },
    ],
  },
  {
    title: 'Security of personal data',
    list: [
      {
        title:
          'The Controller conducts a risk analysis to ensure that personal data is processed in a secure manner, in particular ensuring that only authorised persons have access to the personal data and only to the extent necessary for the performance of the relevant purposes. The Controller shall ensure that all operations on personal data are recorded and performed only by authorised employees and associates.',
        list: [],
      },
      {
        title:
          "The Controller undertakes all necessary measures to ensure that the Controller's subcontractors and other contracted entities guarantee the application of adequate security measures whenever they process personal data on the Controller's behalf.",
        list: [],
      },
    ],
  },
  {
    title: 'Final remarks',
    list: [
      {
        title:
          'The Controller does not make any decision regarding Users based on automated processing, including profiling.',
        list: [],
      },
      {
        title:
          'This Privacy Policy may be updated. When it is, the effective date below will be changed. Any previous versions of the Privacy Policy will be available upon request.',
        list: [],
      },
    ],
  },
];
