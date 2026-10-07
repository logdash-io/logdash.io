export type LegalListItem = string | { title: string; list?: string[] };

type LegalDocumentSection = {
  title: string;
  paragraphs?: string[];
  list?: {
    title?: string;
    list?: LegalListItem[];
  }[];
};

export type LegalDocumentDefinition = LegalDocumentSection[];
