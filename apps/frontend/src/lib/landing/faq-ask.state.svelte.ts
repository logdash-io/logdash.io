type FaqAskStatus = 'asking' | 'answered' | 'failed';

type FaqAskEntry = {
  id: number;
  question: string;
  status: FaqAskStatus;
  answer: string;
  failure: string;
};

type FaqAskResponse = { answer: string };

const RATE_LIMITED_MESSAGE =
  'That was a lot of questions in a row. Try again in a minute, or';
const FAILED_MESSAGE = 'No answer this time. Try again, or';

export class FaqAskState {
  public entries = $state<FaqAskEntry[]>([]);

  public get isAsking(): boolean {
    return this.entries.some((entry) => entry.status === 'asking');
  }

  public async ask(question: string): Promise<void> {
    this.entries.push({
      id: this.entries.length,
      question,
      status: 'asking',
      answer: '',
      failure: '',
    });

    const entry = this.entries[this.entries.length - 1];

    try {
      const response = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ question }),
      });

      if (!response.ok) {
        entry.status = 'failed';
        entry.failure =
          response.status === 429 ? RATE_LIMITED_MESSAGE : FAILED_MESSAGE;
        return;
      }

      const { answer } = (await response.json()) as FaqAskResponse;

      entry.answer = answer;
      entry.status = 'answered';
    } catch {
      entry.status = 'failed';
      entry.failure = FAILED_MESSAGE;
    }
  }
}
