import express from 'express';
import path from 'path';
import { Database } from './database';
import { grandRapidsTestString } from './ocrTestString';
import { Formats, OcrFormat, Scraper } from './scraper';
//tslint:disable
const crawler = require('crawler-request');
// tslint:enable

const app = express();

export const seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';
export const grandRapidsUrl = "https://scontent-lax3-1.xx.fbcdn.net/v/t1.0-9/136045236_3924823007580721_1149603865612359472_n.jpg?_nc_cat=100&ccb=2&_nc_sid=8bfeb9&_nc_ohc=H2OACe9KsHYAX-fGdlp&_nc_ht=scontent-lax3-1.xx&oh=9f33be81e510cebdc9bc83961dcdf037&oe=601E2A96";
export const waterfordUrl = "https://www.speedbowlct.com/wp-content/uploads/2021/01/2021-New-London-Waterford-Speedbowl-Event-Schedule-scaled.jpg";
export const lincolnUrl = "http://lincolnspeedway.com/wp-content/uploads/2020/12/2021-Lincoln-Schedule-1.pdf";
export const staffordUrl = "https://staffordmotorspeedway.com/schedule/";
export const staffordPdf = "http://www.thompsonspeedway.com/sites/default/files/upload/files/FINAL%20-2021%20Oval%20Track%20Schedule%20Grid.pdf";
export const bapsUrl = "https://www.bapsmotorspeedway.com/schedule/media.aspx?s=17800";
export const portRoyalUrl = "https://portroyalspeedway.com/index.php/schedule/";

async function readTextFromSource(url: string, trackName: string, format: OcrFormat): Promise<void>
{
  let text: string;
  if (url.endsWith("pdf"))
  {
    const response = await crawler(url);
    text = response.text;
    console.log(text)
  }
  else if (url.indexOf(".jpg") > -1) // TOOD: support more than jpg
  {
    text = await Scraper.executeOCR(url, false);
  }
  else // webpage, do scraping
  {
    text = await Scraper.executeScraping(url);
  }

  // console.log("OCR text: ");
  // console.log(text);
  const dates: Date[] = Scraper.guessDatesFromString(text, format);

  Scraper.addDatesForTrack(trackName, dates);
}

async function testing(): Promise<void>
{
  // readTextFromSource(seekonkUrl, "Seekonk Speedway", Formats.seekonk);
  // readTextFromSource(waterfordUrl, "Waterford Speedbowl", Formats.normal);
  // readTextFromSource(grandRapidsUrl, "Grand Rapids", Formats.monthDelimiterDay);
  // readTextFromSource(lincolnUrl, "Lincoln Speedway", Formats.monthDelimiterDay);
  // readTextFromSource(staffordPdf, "Stafford Speedway", Formats.monthDelimiterDay);
  // readTextFromSource(bapsUrl, "BAPS Motor Speedway", Formats.normal);
  // readTextFromSource(portRoyalUrl, "Port Royal Speedway", Formats.monthDelimiterDay);

  Database.addEvent("2021-01-08", "Seekonk Speedway");

  // const result = await Database.getDate("2021-01-08")
  // console.log(result);

  // doScraping();
}
testing();



app.get("/test", (req, res) => {
  console.log("/test")
  res.json({message: "Hello World"});
})

// // The "catchall" handler: for any request that doesn't
// // match one above, send back React's index.html file.
// app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname+'/client/build/index.html'));
//   });


// Don't touch the following - Heroku gets very finnicky about it

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));

const root = path.join(__dirname, '..', 'client', 'build')
app.use(express.static(root));
app.get("*", (req, res) => {
    res.sendFile('index.html', { root });
})

const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`server started on port ${port}`)
});


// TODO: need to hold state or something for distance filtering (probably in a separate lookup so we don't
//  have to worry about object equality in the set)
