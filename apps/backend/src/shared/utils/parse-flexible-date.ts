export function parseFlexibleDate(dateString: string): Date {
  let datePart, timePart;

  if (dateString.includes('T')) {
    [datePart, timePart] = dateString.split('T');
  } else {
    datePart = dateString;
    timePart = '00';
  }

  const normalizedTime = timePart.split(':').concat(['00', '00']).slice(0, 2).join(':');

  const fullDateString = `${datePart}T${normalizedTime}:00Z`;

  return new Date(fullDateString);
}
