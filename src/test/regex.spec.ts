import { Scraper, Formats } from "../scraper";

function compareDates(date1: Date, date2: Date): boolean
{
  return date1.getFullYear() === date2.getFullYear() 
    && date1.getMonth() === date2.getMonth()
    && date1.getDay() === date2.getDay();
}

const currentYear = new Date().getFullYear();

////////////////////////////////////////////////////////////////////////////////////////

describe("somethign else", () => {
  it("dummy", () => {
    expect(1).toBeTruthy();
  })
})

describe("monthDelimiterDay", () => {
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
    expect(compareDates(dates[0], new Date("6-16-21"))).toBeTruthy();
    expect(compareDates(dates[1], new Date("6-19-21"))).toBeTruthy();
    expect(compareDates(dates[4], new Date("8-19-21"))).toBeTruthy();
    expect(compareDates(dates[7], new Date("6-5-21"))).toBeTruthy();
  });

  //TODO: need to implement this
  it("monthDelimiterDay advanced parsing single", () => {
    const testString: string = `OCT. 8-10`;
    const dates: Date[] = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.length).toEqual(3);
    expect(compareDates(dates[0], new Date(`10-8-${currentYear}`)));
    expect(compareDates(dates[1], new Date(`10-9-${currentYear}`)));
    expect(compareDates(dates[2], new Date(`10-10-${currentYear}`)));
  });

  it("monthDelimiterDay advanced parsing single", () => {
    const testString: string = `SAT-SUN APRIL 
    10-11
    OCT. 8-10 
    january | 7-8
    sept. 9 - 10
    sep. 16 - 17
    nov. 5- 10
    december 4 -5
    `;

    const dates: Date[] = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.length).toEqual(19);
    expect(compareDates(dates[0], new Date(`4-10-${currentYear}`)));
    expect(compareDates(dates[18], new Date(`12-5-${currentYear}`)));
  });
})

