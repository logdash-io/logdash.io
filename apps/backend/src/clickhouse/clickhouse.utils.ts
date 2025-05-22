export class ClickhouseUtils {
  public static jsDateToClickhouseDate(date: Date): string {
    return date.toISOString().replace('T', ' ').replace('Z', '');
  }

  public static clickhouseDateToJsDate(date: string): Date {
    return new Date(date + 'Z');
  }
}
