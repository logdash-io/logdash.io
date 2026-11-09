const STORAGE_KEY = 'logdash-docs-code-tab';

class CodeTabPreference {
  public title: string | null = $state(null);

  public restore(): void {
    this.title ??= localStorage.getItem(STORAGE_KEY);
  }

  public choose(title: string): void {
    this.title = title;
    localStorage.setItem(STORAGE_KEY, title);
  }
}

export const codeTabPreference = new CodeTabPreference();
