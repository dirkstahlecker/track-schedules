import Tesseract from 'tesseract.js';
import rp from 'request-promise';
import cheerio from 'cheerio';
import { grandRapidsTestString, waterfordTestString } from './ocrTestString';

const seekonkUrl = 'https://seekonkspeedway.com/wp-content/uploads/2020/12/12021-SCH-POSTER.jpg';


// Regex should return groups that are the full date
const delimitersRegex = /(?:\||-|\/)+/;
const seekonkRegex = /(?:JUN|JULY|AUG|SEPT|OCT|NOV|DEC|JUN|JUL|JAN|FEB|MAR|APR|MAY|JUNE)\s+(?:\d{1,2})/gmi;
const monthDelimiterDayRegex = /(?:january|jan|february|feb|march|mar|april|apr|may|jun|june|july|jul|august|aug|sep|sept|september|october|oct|november|nov|december|dec)\s+[\|]*\s*(?:\d{1,2})/gmi;
const normalDateRegex = /([\d]{1,2}[-\/][\d]{1,2}[-\/][\d]{2,4})/gmi;

const currentYear: number = new Date().getFullYear();

abstract class DateHelper
{
  private static stringToMonth(text: string): number | null
  {
    const month: string = text.toLowerCase().trim();
    switch (month)
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
        console.error("Invalid date: " + text);
        return null;
    }
  }

  // isolate the actual date object creation in case we need to do something with timezones
  private static makeDateBase(month: number | null, day: number | null, year: number = currentYear): Date | null
  {
    if (month == null || day == null)
    {
      console.error(`Cannot make date - invalid arguments. month: ${month}, day: ${day}, year: ${year}`);
      return null;
    }
    return new Date(year, month, day);
  }

  public static makeDateSeekonk = (matchText: string): Date | null => {
    const pieces = matchText.split(" ");
    const month: number | null = DateHelper.stringToMonth(pieces[0]);
    const day = Number.parseInt(pieces[1], 10);
    return DateHelper.makeDateBase(month, day);
  }

  public static makeDateNormal = (matchText: string): Date | null => {
    const pieces = matchText.split(delimitersRegex);
    const monthIndex: number = Number.parseInt(pieces[0], 10) - 1;
    const day = Number.parseInt(pieces[1], 10);
    // const year = Number.parseInt(pieces[2], 10);
    return DateHelper.makeDateBase(monthIndex, day);
  }

  public static makeDateMonthDelimiterDay = (matchText: string): Date | null => {
    const pieces = matchText.split(delimitersRegex);
    const monthIndex = DateHelper.stringToMonth(pieces[0]);
    const day = Number.parseInt(pieces[1], 10);
    return DateHelper.makeDateBase(monthIndex, day);
  };
}

type OcrFormat = {regex: RegExp, makeDate: (matchText: string) => Date | null};

export const Formats = {
  seekonk: {
    regex: seekonkRegex,
    makeDate: DateHelper.makeDateSeekonk
  },
  normal: {
    regex: normalDateRegex,
    makeDate: DateHelper.makeDateNormal
  },
  monthDelimiterDay: {
    regex: monthDelimiterDayRegex,
    makeDate: DateHelper.makeDateMonthDelimiterDay
  }
}

export abstract class Scraper
{
  private static dateTrackMap: Map<Date, Set<string>> = new Map();

  public static addTracksToDate(date: Date, trackNames: Set<string>): void
  {
    const existingTracks: Set<string> = this.dateTrackMap.get(date);
    this.dateTrackMap.set(date, new Set([...existingTracks, ...trackNames]));
  }

  public static addDatesForTrack(trackName: string, dates: Date[]): void
  {
    dates.forEach((date: Date) => {
      const existingTracks: Set<string> | undefined = this.dateTrackMap.get(date);
      // const newTracks: Set<string> = existingTracks === undefined
      //   ? new Set<string>(trackName) : new Set([...existingTracks, trackName]);
      let newTracks: Set<string> = new Set();
      newTracks.add(trackName);
      if (existingTracks !== undefined)
      {
        newTracks = new Set([...existingTracks]);
      }
      this.dateTrackMap.set(date, newTracks);
    });
    console.log(this.dateTrackMap)
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
    // return Promise.resolve(ocrTestString);
    return Promise.resolve(grandRapidsTestString);

    const { data: { text } } = await Tesseract.recognize(
      url, 'eng', { logger: (m1) => { if (log) console.log(m1) }}
    );
    console.log("returning")
    return text;
  }

  public static guessDatesFromString(fullText: string, format: OcrFormat): Date[]
  {
    const possibleDates: Date[] = [];
    const groups: RegExpMatchArray | undefined = fullText.match(format.regex);
    console.log("groups: ");
    console.log(groups);

    if (groups === undefined)
    {
      console.error("Cannot guess any dates");
      return [];
    }

    groups.forEach((group) => {
      const date: Date | null = format.makeDate(group);
      if (date != null)
      {
        possibleDates.push(date);
      }
    });

    console.log("Possible dates: ");
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
