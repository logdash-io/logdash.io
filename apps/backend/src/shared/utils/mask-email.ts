export const maskEmail = (email: string): string => {
  const at = email.lastIndexOf('@');
  const dot = email.lastIndexOf('.');

  if (at < 1 || dot < at + 2) {
    return '***';
  }

  return `${keepStart(email.slice(0, at))}@${keepStart(email.slice(at + 1, dot))}${email.slice(dot)}`;
};

const keepStart = (value: string): string => `${value.slice(0, value.length > 3 ? 2 : 1)}***`;
