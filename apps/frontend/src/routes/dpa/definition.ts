import type { LegalDocumentDefinition } from '$lib/domains/shared/ui/legal/LegalDocumentDefinition';

export const DPAdefinition: LegalDocumentDefinition = [
  {
    title: 'Subject and parties',
    paragraphs: [
      'This Data Processing Agreement (the "DPA") supplements the Terms of Service (the "Terms") and forms part of the Agreement between Logdash and the Client. Terms defined in the Terms have the same meaning in this DPA.',
      'Logdash is Aleksander Błaszkiewicz NIP 9571167927 REGON 527410431, ul. Rakoczego 19 lok. 4, 80-288 Gdańsk, Poland, e-mail: support@logdash.io.',
      'This DPA applies whenever Logdash processes personal data on behalf of the Client while providing the Platform, in particular web analytics about visitors of the Client\'s websites and logs sent from the Client\'s applications (the "Client Personal Data"). For this processing the Client is the controller and Logdash is the processor within the meaning of Regulation (EU) 2016/679 (the "GDPR").',
      "Logdash processes the personal data of Users' accounts, of billing and of visitors of its own website as a controller. That processing is described in the Privacy Policy and is not covered by this DPA.",
      'If this DPA and the Terms conflict on the protection of personal data, this DPA prevails.',
    ],
  },
  {
    title: 'Subject matter, duration, nature and purpose of the processing',
    list: [
      {
        title:
          'Subject matter: the processing of Client Personal Data needed to provide the Platform to the Client.',
      },
      {
        title:
          'Duration: the term of the Agreement and, after it ends, the time until the Client Personal Data is deleted under §12.',
      },
      {
        title:
          'Nature: receiving data through the ingestion endpoints of the Platform, storing, querying, aggregating and displaying it in the Platform and its API, backing it up, and sending alerts to the destinations the Client sets up.',
      },
      {
        title:
          'Purpose: providing the Platform under the Agreement, including web analytics, logging, metrics, uptime monitoring, status pages and alerts.',
      },
    ],
  },
  {
    title: 'Data subjects and categories of personal data',
    list: [
      {
        title: 'The data subjects are:',
        list: [
          "visitors of the Client's websites and web applications that load the Logdash web analytics script;",
          "users of the Client's applications whom the Client identifies to the web analytics;",
          'any other person whose personal data the Client includes in logs, metrics, monitors or status pages;',
          'recipients of alerts named by the Client.',
        ],
      },
      {
        title: 'For web analytics, Logdash stores:',
        list: [
          "a pseudonymous visitor identifier: a SHA-256 hash of a random daily salt, the site, the visitor's IP address and the browser's User-Agent, computed on the Logdash server;",
          'a session identifier assigned by the Logdash server;',
          "where the Client calls identify, a pseudonymous user identifier: a SHA-256 hash of the site ID and the Client's user ID, computed in the visitor's browser, so the user ID itself never leaves the browser;",
          'page paths without query strings or fragments, event names, the host name of the referring website, campaign (UTM) tags and the name of an advertising click identifier parameter, never its value;',
          "the device type, browser and operating system, derived from the User-Agent, and a country, derived from the browser's time zone;",
          'the time of each event.',
        ],
      },
      {
        title:
          'IP addresses are used only to compute the visitor identifier and are never stored. User-Agent strings are used only to compute the visitor identifier and to derive the device type, browser and operating system, and are not stored. The daily salt is 32 random bytes created for each UTC day, held only in Redis and deleted 30 minutes after that day ends. After that, nobody, Logdash included, can recompute the visitor identifiers of that day.',
      },
      {
        title:
          'For logs, metrics, monitors, status pages and alerts, Logdash stores the content the Client sends or configures. It may include any personal data the Client chooses to include, and the e-mail addresses, chat identifiers and webhook addresses of alert recipients.',
      },
    ],
  },
  {
    title: 'Instructions',
    list: [
      {
        title:
          'Logdash processes Client Personal Data only on documented instructions from the Client, including with regard to transfers to a third country or an international organisation, unless Union or Member State law to which Logdash is subject requires otherwise. In that case Logdash informs the Client of that legal requirement before processing, unless that law prohibits such information on important grounds of public interest.',
      },
      {
        title:
          "The Terms, this DPA and the settings the Client chooses in the Platform are the Client's documented instructions. The Client may send further instructions to support@logdash.io.",
      },
      {
        title:
          'Logdash immediately informs the Client if, in its opinion, an instruction infringes the GDPR or other Union or Member State data protection provisions.',
      },
    ],
  },
  {
    title: 'Obligations of the Client',
    list: [
      {
        title:
          'The Client is responsible for the lawfulness of the processing, including its legal basis, and for informing data subjects, for example in the privacy policy of its website.',
      },
      {
        title:
          'The Client decides whether its use of web analytics requires the consent of its visitors under the law that applies to it, and obtains that consent where it is required. Logdash describes the processing precisely but does not make this decision for the Client.',
      },
    ],
  },
  {
    title: 'Confidentiality',
    list: [
      {
        title:
          'Logdash ensures that persons authorised to process Client Personal Data have committed themselves to confidentiality or are under an appropriate statutory obligation of confidentiality.',
      },
      {
        title:
          'Logdash accesses Client Personal Data only as far as needed to provide, secure and support the Platform, or when the Client asks for it.',
      },
    ],
  },
  {
    title: 'Security of processing',
    list: [
      {
        title:
          'Logdash implements the technical and organisational measures required by Article 32 of the GDPR, in particular:',
        list: [
          'the Platform, its API and the web analytics script are served over HTTPS, and the website origins a Client registers for web analytics must use HTTPS, apart from localhost for development;',
          'the data of a domain in the Platform is available only to the members of that domain, and the role of each member limits what they can change;',
          'sign-in sessions expire after at most 7 days, and personal API keys are stored only as HMAC-SHA256 digests;',
          'changes to resources in the Platform are recorded in an audit log;',
          'data ingestion is rate limited per plan;',
          'web analytics minimises data as described in §3: a daily salt, no stored IP addresses or User-Agent strings, page paths stored without query strings or fragments and with path segments that contain an @ sign replaced, and requests from known bots discarded;',
          'backups of the databases are scheduled every 15 minutes, encrypted with AES-256 using keys derived with PBKDF2-HMAC-SHA256, protected against tampering with HMAC-SHA256 and kept for 14 days;',
          'production secrets are kept outside the source code.',
        ],
      },
      {
        title:
          'Logdash may update these measures, provided the overall level of protection does not decrease.',
      },
    ],
  },
  {
    title: 'Sub-processors',
    list: [
      {
        title:
          'The Client gives Logdash general authorisation to engage sub-processors. Logdash engages the following sub-processors:',
        list: [
          'Hetzner Online GmbH: hosts the servers that run the Logdash API (api.logdash.io) in Falkenstein, Germany;',
          'Cloudflare: runs the logdash.io web application on Cloudflare Workers, through which Client Personal Data can pass when it is shown in the Platform;',
          'Resend: delivers alert e-mails to the recipients the Client sets up;',
          'GitHub: runs the backup jobs on GitHub-hosted runners, which read the databases and encrypt the dumps, and stores the encrypted backups described in §7.',
        ],
      },
      {
        title:
          "Logdash informs the Client of any intended addition or replacement of a sub-processor before it takes effect, by e-mail to the address of the Client's Account and by updating this list. The Client may object on reasonable grounds by e-mail to support@logdash.io. If the objection cannot be resolved, the Client may terminate the Agreement.",
      },
      {
        title:
          'Logdash imposes on each sub-processor, by contract, the data protection obligations set out in this DPA, in particular sufficient guarantees of appropriate technical and organisational measures. Logdash remains fully liable to the Client for the performance of the obligations of its sub-processors.',
      },
      {
        title:
          "When the Client connects a Telegram chat or a webhook as a notification channel, Logdash sends alert content to that destination on the Client's instruction. The Client chooses that destination, and its provider is not a sub-processor of Logdash.",
      },
    ],
  },
  {
    title: 'Transfers outside the European Economic Area',
    paragraphs: [
      'Logdash transfers Client Personal Data to a third country or an international organisation only where the conditions of Chapter V of the GDPR are met, in particular on the basis of an adequacy decision of the European Commission or of the standard contractual clauses adopted by the European Commission.',
    ],
  },
  {
    title: 'Assistance to the Client',
    list: [
      {
        title:
          'Taking into account the nature of the processing, Logdash assists the Client by appropriate technical and organisational measures, insofar as this is possible, in responding to requests from data subjects exercising their rights under Chapter III of the GDPR. Logdash passes any such request it receives on to the Client it concerns, where Logdash can tell which Client that is.',
      },
      {
        title:
          'Once the salt of a day has been deleted, an anonymous visitor cannot be matched to the events of that day. For an identified user, the Client can compute the stored user identifier, the SHA-256 hash of the site ID, a colon and the user ID, and send it to support@logdash.io. Logdash then provides or deletes the matching events, as the Client asks.',
      },
      {
        title:
          'Logdash assists the Client in ensuring compliance with its obligations under Articles 32 to 36 of the GDPR, taking into account the nature of the processing and the information available to Logdash.',
      },
    ],
  },
  {
    title: 'Personal data breaches',
    list: [
      {
        title:
          "Logdash notifies the Client without undue delay after becoming aware of a personal data breach affecting Client Personal Data, by e-mail to the address of the Client's Account.",
      },
      {
        title:
          'The notification describes, as far as the information is available, the nature of the breach including the categories and approximate number of data subjects and records concerned, its likely consequences and the measures taken or proposed to address it. Information that is not available at first follows as soon as it is.',
      },
    ],
  },
  {
    title: 'Deletion and return of data',
    list: [
      {
        title:
          'The Client can delete a domain in the Platform at any time. This deletes the web analytics events, logs, metrics, monitors with their results, status pages and API keys of that domain.',
      },
      {
        title:
          "Web analytics events are deleted automatically once the retention period of the Client's plan, as it was when each event was received, has passed. Logs are deleted 32 days after the day they were received.",
      },
      {
        title:
          'When the Agreement ends, Logdash deletes the Client Personal Data, unless Union or Member State law requires its storage. If the Client asks at support@logdash.io before the Agreement ends, Logdash first returns the Client Personal Data in a common machine-readable format.',
      },
      {
        title:
          'Copies in backups are deleted when the backups expire, 14 days after they were made.',
      },
    ],
  },
  {
    title: 'Audits',
    list: [
      {
        title:
          'Logdash makes available to the Client all information necessary to demonstrate compliance with the obligations laid down in Article 28 of the GDPR, and allows for and contributes to audits, including inspections, conducted by the Client or another auditor mandated by the Client.',
      },
      {
        title:
          'The Client sends audit requests to support@logdash.io with reasonable notice. Audits take place on Business Days, in a way that does not disclose the data of other clients and does not put the security of the Platform at risk.',
      },
    ],
  },
  {
    title: 'Final provisions',
    list: [
      {
        title: 'This DPA is governed by the law that governs the Agreement.',
      },
      {
        title:
          'Logdash may amend this DPA under the rules that apply to amendments of the Terms.',
      },
    ],
  },
];
