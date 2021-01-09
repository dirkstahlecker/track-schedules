import Tesseract from 'tesseract.js';
import rp from 'request-promise';
import cheerio from 'cheerio';
import { ocrTestString } from './ocrTestString';

const seekonkRegex = /(?:JUN|JULY|AUG|SEPT|OCT|NOV|DEC|JUN|JUL|JAN|FEB|MAR|APR|MAY|JUNE)\s+(?:\d{1,2})/gmi;
const seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';

const currentYear: number = new Date().getFullYear();

abstract class DateHelper
{
  private static stringToMonth(text: string): number
  {
    switch (text.toLowerCase())
    {
      case "jan":
      case "january":
        return 0;
      case "feb":
      case "february":
        return 1;
      case "mar":
      case "march":
        return 2;
      case "apr":
      case "april":
        return 3;
      case "may":
        return 4;
      case "jun":
      case "june":
        return 5;
      case "jul":
      case "july":
        return 6;
      case "aug":
      case "august":
        return 7;
      case "sept":
      case "sep":
      case "september":
        return 8;
      case "oct":
      case "october":
        return 9;
      case "nov":
      case "november":
        return 10;
      case "dec":
      case "december":
        return 11;
      default:
        throw new Error("Invalid date: " + text);
    }
  }

  public static makeDateSeekonk = (text: string) => {
    const pieces = text.split(" ");
    return new Date(DateHelper.stringToMonth(pieces[1]), Number.parseInt(pieces[0], 10), currentYear);
  }
}

const Formats = {
  "seekonk": {
    regex: seekonkRegex,
    makeDate: DateHelper.makeDateSeekonk
  },
}

export abstract class Scraper
{
  private static dateTrackMap: Map<Date, Set<string>> = new Map();

  public static addTracksToDate(date: Date, trackNames: Set<string>): void
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

  public static guessDatesFromString(text: string, format: string): Date[]
  {
    const possibleDates: Date[] = [];
    const groups = text.match(Formats.seekonk.regex);
    console.log(groups);

    groups.forEach((group) => {
      possibleDates.push(Formats.seekonk.makeDate(group));
    });

    console.log(possibleDates)
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

type OcrFormat = {regex: RegExp, makeDate: (text: string) => Date};