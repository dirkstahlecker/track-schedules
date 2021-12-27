"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.portRoyalUrl = exports.bapsUrl = exports.staffordPdf = exports.staffordUrl = exports.lincolnUrl = exports.waterfordUrl = exports.grandRapidsUrl = exports.seekonkUrl = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const database_1 = require("./database");
const scraper_1 = require("./scraper");
const body_parser_1 = __importDefault(require("body-parser"));
const app = express_1.default();
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// Don't touch the following - Heroku gets very finnicky about it
// Serve static files from the React app
app.use(express_1.default.static(path_1.default.join(__dirname, 'client/build')));
app.use(express_1.default.json()); // to support JSON-encoded bodies
app.use(express_1.default.urlencoded()); // to support URL-encoded bodies
app.use(body_parser_1.default.urlencoded({ extended: true }));
app.use(body_parser_1.default.json());
// app.use(bodyParser.json())
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// )
/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
exports.seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';
exports.grandRapidsUrl = "https://scontent-lax3-1.xx.fbcdn.net/v/t1.0-9/136045236_3924823007580721_1149603865612359472_n.jpg?_nc_cat=100&ccb=2&_nc_sid=8bfeb9&_nc_ohc=H2OACe9KsHYAX-fGdlp&_nc_ht=scontent-lax3-1.xx&oh=9f33be81e510cebdc9bc83961dcdf037&oe=601E2A96";
exports.waterfordUrl = "https://www.speedbowlct.com/wp-content/uploads/2021/01/2021-New-London-Waterford-Speedbowl-Event-Schedule-scaled.jpg";
exports.lincolnUrl = "http://lincolnspeedway.com/wp-content/uploads/2020/12/2021-Lincoln-Schedule-1.pdf";
exports.staffordUrl = "https://staffordmotorspeedway.com/schedule/";
exports.staffordPdf = "http://www.thompsonspeedway.com/sites/default/files/upload/files/FINAL%20-2021%20Oval%20Track%20Schedule%20Grid.pdf";
exports.bapsUrl = "https://www.bapsmotorspeedway.com/schedule/media.aspx?s=17800";
exports.portRoyalUrl = "https://portroyalspeedway.com/index.php/schedule/";
async function testing() {
    // readTextFromSource(seekonkUrl, "Seekonk Speedway", Formats.seekonk);
    // readTextFromSource(waterfordUrl, "Waterford Speedbowl", Formats.normal);
    // readTextFromSource(grandRapidsUrl, "Grand Rapids", Formats.monthDelimiterDay);
    // readTextFromSource(lincolnUrl, "Lincoln Speedway", Formats.monthDelimiterDay);
    // readTextFromSource(staffordPdf, "Stafford Speedway", Formats.monthDelimiterDay);
    // readTextFromSource(bapsUrl, "BAPS Motor Speedway", Formats.normal);
    // readTextFromSource(portRoyalUrl, "Port Royal Speedway", Formats.monthDelimiterDay);
    // Database.addEvents(["2021-01-08"], ["Seekonk Speedway"]);
    // const result = await Database.getEventForTrackAndDate("2021-01-08", "Seekonk Speedway");
    // console.log(result);
    // doScraping();
}
// testing();
app.post("/api/events/add", async (req, res) => {
    console.log(`/api/events/add`);
    const date = req.params.date;
    const trackname = req.params.trackname;
    const state = req.params.state;
    console.log(`date: ${date}, trackname: ${trackname}, state: ${state}`);
    if (date == null || date === "") {
        console.error("date is null");
        return;
    }
    if (trackname == null || trackname === "") {
        console.error("trackname is null");
        return;
    }
    const result = await database_1.Database.addEvents([date], [trackname], [state]);
    res.set('Content-Type', 'application/json');
    res.json(result);
});
// send in a string that can be converted to a date here
// then the server will put it in the right format
app.get("/api/events/:date", async (req, res) => {
    console.log(`/api/events/${req.params.date}`);
    const result = await database_1.Database.getEventsForDate(req.params.date, null);
    res.set('Content-Type', 'application/json');
    res.json(result);
});
app.get("/api/events/:date/state/:state", async (req, res) => {
    const state = req.params.state;
    console.log(`/api/events/${req.params.date}/state/${state}`);
    if (state.length !== 2) // TODO: better error handling
     {
        throw new Error("Invalid state");
    }
    const result = await database_1.Database.getEventsForDate(req.params.date, state);
    res.set('Content-Type', 'application/json');
    res.json(result);
});
app.get("/api/events/dateRange/:dateRange", async (req, res) => {
    console.log(`/api/events/dateRange/${req.params.dateRange}`);
    const result = await database_1.Database.getEventsForDateRange(req.params.dateRange, null);
    res.set('Content-Type', 'application/json');
    res.json(result);
});
// app.get("/api/events/state/:state", async(req, res) => {
//   console.log(`/api/events/state/${req.params.state}`);
//   const result = await Database.getEventsForState(req.params.state);
//   res.set('Content-Type', 'application/json');
// 	res.json(result);
// });
app.post("/api/events/parseDocument", async (req, res) => {
    console.log(`/api/events/parseDocument`);
    const url = req.body.url;
    const trackname = req.body.trackname;
    const state = req.body.state;
    console.log(`url: ${url}, trackname: ${trackname}, state: ${state}`);
    if (url == null || url === "") {
        console.error("date is null");
        return;
    }
    if (trackname == null || trackname === "") {
        console.error("trackname is null");
        return;
    }
    if (state == null || state === "") {
        console.error("state is null");
        return;
    }
    // TODO: allow manually specifying format?
    const result = await scraper_1.Scraper.readTextFromSource(url, trackname, state); // guess format
    console.log(`result returning from API:`);
    console.log(result);
    res.set('Content-Type', 'application/json');
    res.json(result);
});
// return unique tracks that are in the database
app.get("/api/tracks/distinct", async (req, res) => {
    console.log(`/api/tracks/distinct`);
    const result = await database_1.Database.getUniqueTracks();
    res.set('Content-Type', 'application/json');
    res.json(result);
});
app.get("/api/", (req, res) => {
    console.log("/test");
    res.json({ message: "Hello World" });
});
// // The "catchall" handler: for any request that doesn't
// // match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname+'/client/build/index.html'));
//   });
// Don't touch the following - Heroku gets very finnicky about it
// Serve static files from the React app
app.use(express_1.default.static(path_1.default.join(__dirname, 'client/build')));
const root = path_1.default.join(__dirname, '..', 'client', 'build');
app.use(express_1.default.static(root));
app.get("*", (req, res) => {
    res.sendFile('index.html', { root });
});
const port = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
    app.listen(port, () => {
        console.log(`server started on port ${port}`);
    });
}
// TODO: need to hold location or something for distance filtering (probably in a separate lookup so we don't
//  have to worry about object equality in the set)
// TODO: endpoint for getting all the tracks that have been added
// Better to just copy the entire page and paste that in instead of scraping html
// have a minimum number of dates in order for a regex format to be chosen - maybe 5 or 6
// TODO: UI - allow for specifying the parsing type and the date format
// preview results before committing to database
// TODO: check regex recently changed
// TODO: how to deal with non-events in schedule? (rain dates, swap meets, etc)
//# sourceMappingURL=server.js.map