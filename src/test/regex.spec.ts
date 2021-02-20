import { seekonkTestString, staffordTestString, waterfordTestString } from "../ocrTestString";
import { Scraper, Formats, OcrFormat } from "../scraper";
import { TestUtils } from "./testUtils";

////////////////////////////////////////////////////////////////////////////////////////

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

    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(8);
    // expect(TestUtils.compareDates(dates[0], new Date("6-16-21"))).toBeTruthy();
    // expect(TestUtils.compareDates(dates[1], new Date("6-19-21"))).toBeTruthy();
    // expect(TestUtils.compareDates(dates[4], new Date("8-19-21"))).toBeTruthy();
    // expect(TestUtils.compareDates(dates[7], new Date("6-5-21"))).toBeTruthy();
  });

  it("monthDelimiterDay advanced parsing single", () => {
    const testString: string = `OCT. 8-10`;
    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(3);
    // expect(TestUtils.compareDates(dates[0], new Date(`10-8-${TestUtils.currentYear}`)));
    // expect(TestUtils.compareDates(dates[1], new Date(`10-9-${TestUtils.currentYear}`)));
    // expect(TestUtils.compareDates(dates[2], new Date(`10-10-${TestUtils.currentYear}`)));
  });

  it("monthDelimiterDay advanced parsing single with th", () => {
    let testString = `OCT. 8th - 10th`;
    let dates = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(3);

    testString = `october 8th-10th`;
    dates = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(3);
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

    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(19);
    // expect(TestUtils.compareDates(dates.has, new Date(`4-10-${TestUtils.currentYear}`)));
    // expect(TestUtils.compareDates(dates[18], new Date(`12-5-${TestUtils.currentYear}`)));
  });

  it("monthDelimiterDay ignores trailing character if present", () => {
    const testString: string = `
    SEPT 9,
    `;

    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(1);
    const datesArray = Array.from(dates);
    expect(datesArray.indexOf(`${TestUtils.currentYear}-09-09`) > -1).toBeTruthy();
  });

  it("monthDelimiterDay doesn't mistake years for days", () => { // TODO: need to fix regex for this too
    const testString: string = "JULY 2021";
    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(0);
  });

  it("monthDelimiterDay deals with st, nd, rd, th after day", () => {
    const testString: string = `
    July 2nd and July 3rd – Bill Gardner Sprintacular
    July 2nd (Friday) USAC/MSCS Sprints, Modifieds, Super Stocks, and Bombers
    July 3rd (Saturday) USAC/MSCS Sprints, MMSA, and Midget Cup`;

    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(2);

    const datesArray = Array.from(dates);
    expect(datesArray.indexOf(`${TestUtils.currentYear}-07-02`) > -1).toBeTruthy();
    expect(datesArray.indexOf(`${TestUtils.currentYear}-07-03`) > -1).toBeTruthy();
  });

  it("invalid dates aren't returned", () => {
    // make sure we don't add dates such as June 31st
    const testString: string = "June 31, November 31st";
    const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
    expect(dates.size).toEqual(0);

    // TODO: leap year (can't test yet because year is always current year)
  });
});

describe("format guesser", () => {
  it("guess format for seekonk string", () => {
    const matchString = seekonkTestString;
    const format: OcrFormat = Scraper.TESTPIN_guessFormat(matchString);
    expect(format).toEqual(Formats.monthDelimiterDay);
  });
  it("guess format for waterford string", () => {
    const matchString = waterfordTestString;
    const format: OcrFormat = Scraper.TESTPIN_guessFormat(matchString);
    expect(format).toEqual(Formats.monthDayYear);
  });
  it("guess format for stafford string", () => {
    const matchString = staffordTestString;
    const format: OcrFormat = Scraper.TESTPIN_guessFormat(matchString);
    expect(format).toEqual(Formats.monthDelimiterDay);
  });
});

