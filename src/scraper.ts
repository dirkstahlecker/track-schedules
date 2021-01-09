import Tesseract from 'tesseract.js';
import rp from 'request-promise';
import cheerio from 'cheerio';
import { ocrTestString } from './ocrTestString';

const seekonkRegex = /(?:JUN|JULY|AUG|SEPT|OCT|NOV|DEC|JUN|JUL|JAN|FEB|MAR|APR|MAY|JUNE)\s+(?:\d{1,2})/gmi;
const seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';

export abstract class Scraper
{
  private static dateTrackMap: Map<Date, Set<string>> = new Map();

  public static addTracksoDate(date: Date, trackNames: Set<string>): void
  {
    const existingTracks: Set<string> = this.dateTrackMap.get(date);
    this.dateTrackMap.set(date, new Set(...existingTracks, ...trackNames));
  }

  public static addDate(date: Date): void
  {
    this.dateTrackMap.set(date, new Set<string>());
  }

  // if a date shows up in the OCR, we assume there's a race on that event
  // we can make a guess as to the classes and whatnot by looking at the rest of the line
  public static async executeOCR(url: string, log: boolean = false): Promise<string>
  {
    // short-circuit for testing
    return Promise.resolve(ocrTestString);

    const { data: { text } } = await Tesseract.recognize(
      url, 'eng', { logger: (m1) => { if (log) console.log(m1) }}
    );
    console.log("returning")
    return text;
  }

  public static guessDatesFromString(text: string): string[]
  {
    const possibleDates: string[] = [];
    const groups = text.match(seekonkRegex);

    console.log(groups);

    return possibleDates;
  }

  public static async doScraping(): Promise<void>
  {
    const url = 'https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States';

    rp(url)
      .then((html) =>
      {
        console.log(cheerio('b > a', html).length);
        console.log(cheerio('b > a', html));
      })
      .catch((err) =>
      {
        // handle error
      });
  }
}
