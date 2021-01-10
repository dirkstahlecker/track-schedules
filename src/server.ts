import express from 'express';
import path from 'path';
import { grandRapidsTestString } from './ocrTestString';
import { Formats, OcrFormat, Scraper } from './scraper';

const app = express();

export const seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';
export const grandRapidsUrl = "https://scontent-lax3-1.xx.fbcdn.net/v/t1.0-9/136045236_3924823007580721_1149603865612359472_n.jpg?_nc_cat=100&ccb=2&_nc_sid=8bfeb9&_nc_ohc=H2OACe9KsHYAX-fGdlp&_nc_ht=scontent-lax3-1.xx&oh=9f33be81e510cebdc9bc83961dcdf037&oe=601E2A96";
export const waterfordUrl = "https://www.speedbowlct.com/wp-content/uploads/2021/01/2021-New-London-Waterford-Speedbowl-Event-Schedule-scaled.jpg";


async function ocr(url: string, trackName: string, format: OcrFormat): Promise<void>
{
  const text = await Scraper.executeOCR(
    url,
    false);
  // console.log("OCR text: ");
  // console.log(text);
  const dates: Date[] = Scraper.guessDatesFromString(text, format);

  Scraper.addDatesForTrack(trackName, dates);
}

ocr(seekonkUrl, "Seekonk Speedway", Formats.seekonk);
ocr(waterfordUrl, "Waterford Speedbowl", Formats.normal);
ocr(grandRapidsUrl, "Grand Rapids", Formats.monthDelimiterDay);

// doScraping();

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