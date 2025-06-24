export class PassphraseGenerator {
  private static readonly adjectives = [
    'quick',
    'silent',
    'bright',
    'swift',
    'clever',
    'brave',
    'calm',
    'wild',
    'bold',
    'fierce',
    'gentle',
    'mighty',
    'sleek',
    'sharp',
    'wise',
    'agile',
  ];

  private static readonly nouns = [
    'fox',
    'eagle',
    'wolf',
    'tiger',
    'bear',
    'hawk',
    'lion',
    'shark',
    'falcon',
    'panther',
    'raven',
    'cobra',
    'lynx',
    'otter',
    'deer',
    'owl',
  ];

  static generate(): string {
    const adjective = this.getRandomElement(this.adjectives);
    const noun = this.getRandomElement(this.nouns);
    const number = Math.floor(Math.random() * 1000);

    return `/${adjective}_${noun}_${number}`;
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
