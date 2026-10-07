import { maskEmail } from './mask-email';

describe('maskEmail', () => {
  it('keeps the start of the name and the domain, and the top level domain', () => {
    expect(maskEmail('john.doe@gmail.com')).toBe('jo***@gm***.com');
    expect(maskEmail('jane@mail.company.co.uk')).toBe('ja***@ma***.uk');
  });

  it('keeps one character of short parts', () => {
    expect(maskEmail('ab@x.io')).toBe('a***@x***.io');
  });

  it('hides anything that is not an email completely', () => {
    expect(maskEmail('not-an-email')).toBe('***');
    expect(maskEmail('john.doe@localhost')).toBe('***');
    expect(maskEmail('@gmail.com')).toBe('***');
  });
});
