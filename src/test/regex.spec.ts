import { Scraper, Formats } from "../scraper";

function compareDate(date1: Date, date2: Date): boolean
{
  return date1.getFullYear() === date2.getFullYear() 
    && date1.getMonth() === date2.getMonth()
    && date1.getDay() === date2.getDay();
}

it("monthDelimiterDay basic parsing", () => {
  const testString: string = `
  WED. JUNE 16 OUTLAW OPEN MODIFIED SERIES + LOCAL CLASSES TBA TBA TBA 
  JUNE 19 - SATURDAY NIGHT SHOWDOWN ISMA SUPER MODIFIEDS, NEMA, NEMA LITES
  JUNE 26 - SATURDAY NIGHT SHOWDOWN
  Thursday | June | 24 | Thursday Night Thunder | LM, M, 55, MWM, Ps, H, PPE
  Thursday | August | 19 | itasca County Fair Special LM, M, S5, MWM, WS
   | August | 20 [ActinPackedEndwro#s | |
  sep. 23 An event
  jun. 5 this event

  `;

  const dates: Date[] = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
  console.log(dates)
  expect(dates.length).toEqual(8);
  expect(compareDate(dates[0], new Date("6-16-21"))).toBeTruthy();
  expect(compareDate(dates[1], new Date("6-19-21"))).toBeTruthy();
  expect(compareDate(dates[4], new Date("8-19-21"))).toBeTruthy();
  expect(compareDate(dates[7], new Date("6-5-21"))).toBeTruthy();
});

//TODO: need to implement this
// it("monthDelimiterDay advanced parsing", () => {
//   const testString: string = `SAT-SUN APRIL 
//   10-11
//   `;

//   const dates: Date[] = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
//   expect(dates.length).toEqual(2);
// })