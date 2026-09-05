import type { LogdashSDKName } from '$lib/domains/shared/types';
import type {
  CodeLanguage,
  DocBlock,
  DocFaqItem,
  DocPage,
  DocsPath,
} from '$lib/landing/guides/documentation.data';

export type SdkSnippet = { language: CodeLanguage; code: string };

export type SdkDoc = {
  /** URL segment: `/docs/node`. */
  slug: string;
  /** Display name: "Node.js". */
  name: string;
  id: LogdashSDKName;
  /** `logdash-io/<repo>` on GitHub. */
  repo: string;
  /**
   * The README the snippets were copied from, pinned to a sha so a future
   * reader can diff what changed upstream.
   */
  sourceRef: { url: string; sha: string };
  /** Copied verbatim from INSTALL_COMMANDS where one exists. */
  install: SdkSnippet;
  init: SdkSnippet;
  log: SdkSnippet;
  metric: SdkSnippet;
  /** Frameworks the SDK is known to work in, plain names. */
  frameworks: string[];
  /** Exactly three. */
  faq: DocFaqItem[];
  /** ISO date, feeds the sitemap. */
  updatedAt: string;
};

export function sdkPath(doc: SdkDoc): DocsPath {
  return `/docs/${doc.slug}` as DocsPath;
}

/**
 * One SDK record renders as one reference page: install, initialise, send a
 * log, send a metric, then the questions people actually ask. The order is
 * fixed on purpose so every SDK page reads the same way.
 */
export function toDocPage(doc: SdkDoc): DocPage {
  const blocks: DocBlock[] = [
    {
      type: 'paragraph',
      text: `Install the package, paste your API key and the first log lands in the dashboard within a second. Everything below is copied from the ${doc.name} SDK README.`,
    },
    { type: 'heading', text: 'Install' },
    { type: 'code', ...doc.install },
    { type: 'heading', text: 'Initialise' },
    {
      type: 'paragraph',
      text: 'Create a project in Logdash, copy its API key and keep it in an environment variable. The key identifies the project the data lands in.',
    },
    { type: 'code', ...doc.init },
    { type: 'heading', text: 'Send a log' },
    { type: 'code', ...doc.log },
    { type: 'heading', text: 'Send a metric' },
    {
      type: 'paragraph',
      text: 'Metrics are named numbers. Set one to an absolute value or mutate it by a delta, and Logdash charts the history.',
    },
    { type: 'code', ...doc.metric },
  ];

  if (doc.frameworks.length > 0) {
    blocks.push(
      { type: 'heading', text: 'Works with' },
      { type: 'list', items: doc.frameworks },
    );
  }

  blocks.push(
    { type: 'heading', text: 'FAQ' },
    { type: 'faq', items: doc.faq },
  );

  return {
    path: sdkPath(doc),
    title: `${doc.name} SDK`,
    description: `Install the Logdash ${doc.name} SDK, send your first log and your first metric.`,
    blocks,
  };
}
