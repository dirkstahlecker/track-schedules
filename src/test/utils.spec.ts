import { TESTPIN_convertDateObjToDatabaseDateString } from "../scraper";

it("convert date object to database date string", () => {
  let date: Date = new Date("01-08-21");
  let convertedDate: string = TESTPIN_convertDateObjToDatabaseDateString(date);
  expect(convertedDate).toEqual("2021-01-08");

  date = new Date("11-9-21");
  convertedDate = TESTPIN_convertDateObjToDatabaseDateString(date);
  expect(convertedDate).toEqual("2021-11-09");

  date = new Date("10-21-21");
  convertedDate = TESTPIN_convertDateObjToDatabaseDateString(date);
  expect(convertedDate).toEqual("2021-10-21");
});
