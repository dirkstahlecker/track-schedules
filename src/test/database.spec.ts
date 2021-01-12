// import { Database, DbRow } from "../database";
// import { TestUtils } from "./testUtils";

// describe("Events", () => {
//   const dates: string[] = ["2000-01-11", "2000-02-02"];
//   const tracknames: string[] = ["Seekonk Speedway", "Lincoln Speedway"];
//   it("insert", async() => {
//     // insert dummy values
//     await Database.addEvents(dates, tracknames);
//   });
//   it("verify", async() => {
//     // verify the inserted values exist
//     let result: DbRow | null = await Database.getEventForTrackAndDate(dates[0], tracknames[0]);
//     // expect(TestUtils.compareDates(result.eventdate, new Date(dates[0]))).toBeTruthy();
//     expect(result.trackname).toEqual(tracknames[0]);

//     result = await Database.getEventForTrackAndDate(dates[1], tracknames[1]);
//     // expect(TestUtils.compareDates(result.eventdate, new Date(dates[1]))).toBeTruthy();
//     expect(result.trackname).toEqual(tracknames[1]);
//   });
//   it("delete", async() => {
//     // clean up by removing the values
//     await Database.deleteEvent(dates[0], tracknames[0]);
//     await Database.deleteEvent(dates[1], tracknames[1]);

//     // verify deleted
//     let result: DbRow | null = await Database.getEventForTrackAndDate(dates[0], tracknames[0]);
//     expect(result).toBeNull();
//     result = await Database.getEventForTrackAndDate(dates[1], tracknames[1]);
//     expect(result).toBeNull();
//   });
// });
