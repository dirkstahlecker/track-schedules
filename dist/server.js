"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.staffordPdf = exports.staffordUrl = exports.lincolnUrl = exports.waterfordUrl = exports.grandRapidsUrl = exports.seekonkUrl = void 0;
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
const scraper_1 = require("./scraper");
//tslint:disable
const crawler = require('crawler-request');
// tslint:enable
const app = express_1.default();
exports.seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';
exports.grandRapidsUrl = "https://scontent-lax3-1.xx.fbcdn.net/v/t1.0-9/136045236_3924823007580721_1149603865612359472_n.jpg?_nc_cat=100&ccb=2&_nc_sid=8bfeb9&_nc_ohc=H2OACe9KsHYAX-fGdlp&_nc_ht=scontent-lax3-1.xx&oh=9f33be81e510cebdc9bc83961dcdf037&oe=601E2A96";
exports.waterfordUrl = "https://www.speedbowlct.com/wp-content/uploads/2021/01/2021-New-London-Waterford-Speedbowl-Event-Schedule-scaled.jpg";
exports.lincolnUrl = "http://lincolnspeedway.com/wp-content/uploads/2020/12/2021-Lincoln-Schedule-1.pdf";
exports.staffordUrl = "https://staffordmotorspeedway.com/schedule/";
exports.staffordPdf = "http://www.thompsonspeedway.com/sites/default/files/upload/files/FINAL%20-2021%20Oval%20Track%20Schedule%20Grid.pdf";
function readTextFromSource(url, trackName, format) {
    return __awaiter(this, void 0, void 0, function* () {
        let text;
        if (url.endsWith("pdf")) {
            const response = yield crawler(url);
            text = response.text;
            console.log(text);
        }
        else if (url.indexOf(".jpg") > -1) // TOOD: support more than jpg
         {
            text = yield scraper_1.Scraper.executeOCR(url, false);
        }
        else // webpage, do scraping
         {
            text = yield scraper_1.Scraper.executeScraping(url);
        }
        // console.log("OCR text: ");
        // console.log(text);
        const dates = scraper_1.Scraper.guessDatesFromString(text, format);
        scraper_1.Scraper.addDatesForTrack(trackName, dates);
    });
}
// readTextFromSource(seekonkUrl, "Seekonk Speedway", Formats.seekonk);
// readTextFromSource(waterfordUrl, "Waterford Speedbowl", Formats.normal);
// readTextFromSource(grandRapidsUrl, "Grand Rapids", Formats.monthDelimiterDay);
// readTextFromSource(lincolnUrl, "Lincoln Speedway", Formats.monthDelimiterDay);
readTextFromSource(exports.staffordPdf, "Stafford Speedway", scraper_1.Formats.monthDelimiterDay);
// doScraping();
app.get("/test", (req, res) => {
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
app.listen(port, () => {
    console.log(`server started on port ${port}`);
});
// TODO: need to hold state or something for distance filtering (probably in a separate lookup so we don't
//  have to worry about object equality in the set)
//# sourceMappingURL=server.js.map