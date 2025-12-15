type LegalDocumentSection = {
  title: string;
  paragraphs?: string[];
  list?: {
    title?: string;
    list?: (string | { title: string; list?: string[] })[];
  }[];
};

export type LegalDocumentDefinition = LegalDocumentSection[];
