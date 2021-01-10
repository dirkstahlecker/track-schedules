export class TestUtils
{
  public static currentYear = new Date().getFullYear();

  public static compareDates(date1: Date, date2: Date): boolean
  {
    return date1.getFullYear() === date2.getFullYear()
      && date1.getMonth() === date2.getMonth()
      && date1.getDay() === date2.getDay();
  }
}
