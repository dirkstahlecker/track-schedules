// import { seekonkTestString, staffordTestString, waterfordTestString } from "../ocrTestString";
// import { Scraper, Formats, OcrFormat } from "../scraper";
// import { TestUtils } from "./testUtils";

// ////////////////////////////////////////////////////////////////////////////////////////

// describe("monthDelimiterDay", () => {
//   it("monthDelimiterDay basic parsing", () => {
//     const testString: string = `
//     WED. JUNE 16 OUTLAW OPEN MODIFIED SERIES + LOCAL CLASSES TBA TBA TBA
//     JUNE 19 - SATURDAY NIGHT SHOWDOWN ISMA SUPER MODIFIEDS, NEMA, NEMA LITES
//     JUNE 26 - SATURDAY NIGHT SHOWDOWN
//     Thursday | June | 24 | Thursday Night Thunder | LM, M, 55, MWM, Ps, H, PPE
//     Thursday | August | 19 | itasca County Fair Special LM, M, S5, MWM, WS
//      | August | 20 [ActinPackedEndwro#s | |
//     sep. 23 An event
//     jun. 5 this event
//     `;

//     const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
//     expect(dates.size).toEqual(8);
//     // expect(TestUtils.compareDates(dates[0], new Date("6-16-21"))).toBeTruthy();
//     // expect(TestUtils.compareDates(dates[1], new Date("6-19-21"))).toBeTruthy();
//     // expect(TestUtils.compareDates(dates[4], new Date("8-19-21"))).toBeTruthy();
//     // expect(TestUtils.compareDates(dates[7], new Date("6-5-21"))).toBeTruthy();
//   });

//   // TODO: need to implement this
//   it("monthDelimiterDay advanced parsing single", () => {
//     const testString: string = `OCT. 8-10`;
//     const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
//     expect(dates.size).toEqual(3);
//     // expect(TestUtils.compareDates(dates[0], new Date(`10-8-${TestUtils.currentYear}`)));
//     // expect(TestUtils.compareDates(dates[1], new Date(`10-9-${TestUtils.currentYear}`)));
//     // expect(TestUtils.compareDates(dates[2], new Date(`10-10-${TestUtils.currentYear}`)));
//   });

//   it("monthDelimiterDay advanced parsing single", () => {
//     const testString: string = `SAT-SUN APRIL
//     10-11
//     OCT. 8-10
//     january | 7-8
//     sept. 9 - 10
//     sep. 16 - 17
//     nov. 5- 10
//     december 4 -5
//     `;

//     const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
//     expect(dates.size).toEqual(19);
//     // expect(TestUtils.compareDates(dates.has, new Date(`4-10-${TestUtils.currentYear}`)));
//     // expect(TestUtils.compareDates(dates[18], new Date(`12-5-${TestUtils.currentYear}`)));
//   });

//   it("monthDelimiterDay doesn't mistake years for days", () => {
//     const testString: string = "JULY 2021";
//     const dates: Set<string> | null = Scraper.guessDatesFromString(testString, Formats.monthDelimiterDay);
//     expect(dates).toBeNull();
//   })
// });

// describe("format guesser", () => {
//   it("guess format for seekonk string", () => {
//     const matchString = seekonkTestString;
//     const format: OcrFormat = Scraper.TESTPIN_guessFormat(matchString);
//     expect(format).toEqual(Formats.monthDelimiterDay);
//   });
//   it("guess format for waterford string", () => {
//     const matchString = waterfordTestString;
//     const format: OcrFormat = Scraper.TESTPIN_guessFormat(matchString);
//     expect(format).toEqual(Formats.monthDayYear);
//   });
//   it("guess format for stafford string", () => {
//     const matchString = staffordTestString;
//     const format: OcrFormat = Scraper.TESTPIN_guessFormat(matchString);
//     expect(format).toEqual(Formats.monthDelimiterDay);
//   });
// });

