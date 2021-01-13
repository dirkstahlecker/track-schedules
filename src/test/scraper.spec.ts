import { Scraper, Formats } from "../scraper";
import { TestUtils } from "./testUtils";

const duplicatesTestString: string = `ACT & PASS NORTHEAST CLASSIC
  Friday, April 16 - Saturday, April 17, 2021
  7:00 6:00 PM
  1.058-Mile Oval
  JULY
  DOUBLEHEADER SATURDAY
  Saturday, July 17, 2021
  1.058-Mile Oval
  LAKES REGION 200
  Saturday, July 17, 2021
  3:00 5:00 PM
  NASCAR Xfinity Series
  1.058-Mile Oval
  NOR'EASTER 100
  Saturday, July 17, 2021
  NASCAR Whelen Modified Tour
  1.058-Mile Oval
  FOXWOODS RESORT CASINO 301
  Sunday, July 18, 2021
  3:00 6:00 PM
  NASCAR Cup Series
  1.058-Mile Oval`; // has duplicate dates, should only add one of them

it("guessDatesFromString duplicates", async() => {
  const result: Set<string> | null = Scraper.guessDatesFromString(duplicatesTestString, Formats.monthDelimiterDay);
  expect(result).toBeDefined();
  expect(result.size).toEqual(4);
  expect(result.has("2021-04-16")).toBeTruthy();
  expect(result.has("2021-04-17")).toBeTruthy();
  expect(result.has("2021-07-17")).toBeTruthy();
  expect(result.has("2021-07-18")).toBeTruthy();
});

