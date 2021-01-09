import express from 'express';
import path from 'path';
import { Formats, Scraper } from './scraper';

const app = express();

async function ocr(): Promise<void>
{
  const text = await Scraper.executeOCR(
    'https://www.speedbowlct.com/wp-content/uploads/2021/01/2021-New-London-Waterford-Speedbowl-Event-Schedule-scaled.jpg',
    true);
  // console.log("OCR text: ");
  // console.log(text);
  const dates: Date[] = Scraper.guessDatesFromString(text, Formats.normal);

  Scraper.addDatesForTrack("Waterford Speedbowl", dates);
}

ocr()
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