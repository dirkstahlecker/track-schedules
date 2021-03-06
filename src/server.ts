import express from 'express';
import path from 'path';
import { Database } from './database';
import { grandRapidsTestString } from './ocrTestString';
import { Formats, OcrFormat, Scraper } from './scraper';
import bodyParser from 'body-parser';


const app = express();

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// Don't touch the following - Heroku gets very finnicky about it

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'client/build')));
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// app.use(bodyParser.json())
// app.use(
//   bodyParser.urlencoded({
//     extended: true,
//   })
// )

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export const seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';
export const grandRapidsUrl = "https://scontent-lax3-1.xx.fbcdn.net/v/t1.0-9/136045236_3924823007580721_1149603865612359472_n.jpg?_nc_cat=100&ccb=2&_nc_sid=8bfeb9&_nc_ohc=H2OACe9KsHYAX-fGdlp&_nc_ht=scontent-lax3-1.xx&oh=9f33be81e510cebdc9bc83961dcdf037&oe=601E2A96";
export const waterfordUrl = "https://www.speedbowlct.com/wp-content/uploads/2021/01/2021-New-London-Waterford-Speedbowl-Event-Schedule-scaled.jpg";
export const lincolnUrl = "http://lincolnspeedway.com/wp-content/uploads/2020/12/2021-Lincoln-Schedule-1.pdf";
export const staffordUrl = "https://staffordmotorspeedway.com/schedule/";
export const staffordPdf = "http://www.thompsonspeedway.com/sites/default/files/upload/files/FINAL%20-2021%20Oval%20Track%20Schedule%20Grid.pdf";
export const bapsUrl = "https://www.bapsmotorspeedway.com/schedule/media.aspx?s=17800";
export const portRoyalUrl = "https://portroyalspeedway.com/index.php/schedule/";





async function testing(): Promise<void>
{
  // readTextFromSource(seekonkUrl, "Seekonk Speedway", Formats.seekonk);
  // readTextFromSource(waterfordUrl, "Waterford Speedbowl", Formats.normal);
  // readTextFromSource(grandRapidsUrl, "Grand Rapids", Formats.monthDelimiterDay);
  // readTextFromSource(lincolnUrl, "Lincoln Speedway", Formats.monthDelimiterDay);
  // readTextFromSource(staffordPdf, "Stafford Speedway", Formats.monthDelimiterDay);
  // readTextFromSource(bapsUrl, "BAPS Motor Speedway", Formats.normal);
  // readTextFromSource(portRoyalUrl, "Port Royal Speedway", Formats.monthDelimiterDay);

  Database.addEvents(["2021-01-08"], ["Seekonk Speedway"]);

  // const result = await Database.getEventForTrackAndDate("2021-01-08", "Seekonk Speedway");
  // console.log(result);

  // doScraping();
}
// testing();










app.post("/api/events/add", async(req, res) => {
  console.log(`/api/events/add`);
  const date = req.params.date;
  const trackname = req.params.trackname;
  console.log(`date: ${date}, trackname: ${trackname}`)

  if (date == null || date === "")
  {
    console.error("date is null");
    return;
  }
  if (trackname == null || trackname === "")
  {
    console.error("trackname is null");
    return;
  }

  const result = await Database.addEvents([date], [trackname]);

	res.set('Content-Type', 'application/json');
	res.json(result);
});

// send in a string that can be converted to a date here
// then the server will put it in the right format
app.get("/api/events/:date", async(req, res) => {
  console.log(`/api/events/${req.params.date}`);

  const result = await Database.getEventsForDate(req.params.date);

  res.set('Content-Type', 'application/json');
	res.json(result);
});

app.post("/api/events/parseDocument", async(req, res) => {
  console.log(`/api/events/parseDocument`);
  const url: string = req.body.url;
  const trackname: string = req.body.trackname;

  console.log(`url: ${url}, trackname: ${trackname}`)

  if (url == null || url === "")
  {
    console.error("date is null");
    return;
  }
  if (trackname == null || trackname === "")
  {
    console.error("trackname is null");
    return;
  }

  // TODO: allow manually specifying format?

  const result = await Scraper.readTextFromSource(url, trackname); // guess format
  console.log(`result returning from API:`);
  console.log(result)

	res.set('Content-Type', 'application/json');
	res.json(result);
});

// return unique tracks that are in the database
app.get("/api/tracks/distinct", async(req, res) => {
  console.log(`/api/tracks/distinct`);

  const result: string[] = await Database.getUniqueTracks();

  res.set('Content-Type', 'application/json');
	res.json(result);
})

app.get("/api/", (req, res) => {
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
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`server started on port ${port}`)
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
