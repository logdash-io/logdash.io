import type { DocPage } from '$lib/landing/guides/documentation.data';

export const page: DocPage = {
  path: '/docs/web-analytics/links',
  title: 'Tag your links',
  description:
    'Tag the links you share with UTM parameters so every visit counts toward the right source, campaign and post instead of Direct.',
  keywords:
    'utm parameters, utm tracking, campaign tracking analytics, referrer tracking',
  blocks: [
    {
      type: 'paragraph',
      text: 'Browsers send only the domain of the referring site, never the post or the page, and many in-app browsers, such as the ones in Reddit, X, Slack and Discord, send no referrer at all. A visit from an untagged link in one of those apps counts as Direct. Tag every link you share so the dashboard can tell where each visit came from.',
    },
    {
      type: 'code',
      language: 'text',
      code: 'https://example.com/?utm_source=reddit&utm_campaign=r_sveltejs&utm_content=1abc2d',
    },
    { type: 'heading', text: 'Parameters' },
    {
      type: 'table',
      headers: ['Parameter', 'Names'],
      rows: [
        [
          '`utm_source`',
          'Where the link is, such as `reddit`, `x` or `newsletter`. Known names, such as `reddit`, `x`, `linkedin`, `google` or `chatgpt`, go to their channel. Other names count as Campaign.',
        ],
        [
          '`utm_campaign`',
          'The group the link belongs to, such as the subreddit or the launch.',
        ],
        [
          '`utm_content`',
          "The exact post, ad or button, such as the post's ID.",
        ],
        ['`utm_medium`, `utm_term`', 'Work as usual.'],
        [
          '`ref`, `via`, `source`',
          'Taken as the source, in that order, when a link has no `utm_source`. `?ref=reddit` counts as source `reddit` in Organic social.',
        ],
      ],
    },
    { type: 'heading', text: 'How visits are attributed' },
    {
      type: 'list',
      items: [
        'A visit with only a campaign or content tag counts as Campaign, never as Direct.',
        "The tracker records the name of an ad click ID, such as `gclid` or Reddit's `rdt_cid`, never its value. A visit with one counts as Paid.",
        'Values follow the rules of event properties: they are trimmed and cut to 100 characters, and a value that contains `@` or a control character is dropped.',
        'All tags come from the first page of the session, so later pages keep the attribution of the link the visitor came in on.',
      ],
    },
    { type: 'heading', text: 'See where visits came from' },
    {
      type: 'paragraph',
      text: 'Under **Details**, the **Channels** card breaks visits down by channel, source, campaign, content, keyword and referrer. Click a source, such as `reddit`, to keep its visits, then open the **Campaign** or **Content** tab to see which subreddit and which post they came from.',
    },
  ],
};
