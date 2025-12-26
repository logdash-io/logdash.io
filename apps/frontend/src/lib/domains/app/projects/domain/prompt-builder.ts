export class PromptBuilder {
  private sections: string[] = [];

  public addHeader(text: string): this {
    this.sections.push(text);
    return this;
  }

  public addSection(title: string, content: string): this {
    this.sections.push(`${title}\n\n${content}`);
    return this;
  }

  public addParagraph(text: string): this {
    this.sections.push(text);
    return this;
  }

  public addCodeBlock(code: string, language?: string): this {
    const lang = language || '';
    this.sections.push(`\`\`\`${lang}\n${code}\n\`\`\``);
    return this;
  }

  public addBulletList(items: string[]): this {
    const list = items.map((item) => `- ${item}`).join('\n');
    this.sections.push(list);
    return this;
  }

  public addInstallCommand(command: string): this {
    this.sections.push(`Install the package:\n${command}`);
    return this;
  }

  public build(): string {
    return this.sections.join('\n\n');
  }
}
