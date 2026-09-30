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

  // The 16 hex chars carry 64 random bits so nobody can guess the passphrase
  // while it waits in the backend. The backend rejects any other shape.
  static generate(): string {
    const adjective = this.getRandomElement(this.adjectives);
    const noun = this.getRandomElement(this.nouns);
    const suffix = Array.from(
      crypto.getRandomValues(new Uint8Array(8)),
      (byte) => byte.toString(16).padStart(2, '0'),
    ).join('');

    return `/${adjective}_${noun}_${suffix}`;
  }

  private static getRandomElement<T>(array: T[]): T {
    return array[crypto.getRandomValues(new Uint32Array(1))[0] % array.length];
  }
}
