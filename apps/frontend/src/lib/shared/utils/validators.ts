export const validateEmail = (email: string): string => {
  if (!email.trim()) return '';

  // Basic email format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  // Domain validation - ensure domain has at least one dot and proper structure
  const domain = email.split('@')[1];
  if (!domain) return 'Invalid email format';

  const domainParts = domain.split('.');
  if (domainParts.length < 2) {
    return 'Email domain must include a valid domain name and extension (e.g., logdash.io)';
  }

  // Check that each part has at least 2 characters (except TLD which can be 2+)
  const domainName = domainParts.slice(0, -1).join('.');
  const tld = domainParts[domainParts.length - 1];

  if (domainName.length < 2 || tld.length < 2) {
    return 'Email domain must include a valid domain name and extension';
  }

  return '';
};
