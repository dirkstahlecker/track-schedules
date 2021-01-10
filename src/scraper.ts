import Tesseract from 'tesseract.js';
import rp from 'request-promise';
import cheerio from 'cheerio';
import { grandRapidsTestString, seekonkTestString, staffordTestString, waterfordTestString } from './ocrTestString';
import { grandRapidsUrl, seekonkUrl, staffordUrl, waterfordUrl } from './server';
//tslint:disable
const crawler = require('crawler-request');
// tslint:enable

// Regex should return groups that are the full date
const regexOptions = {
  // seekonkRegex: /(?:JUN|JULY|AUG|SEPT|OCT|NOV|DEC|JUN|JUL|JAN|FEB|MAR|APR|MAY|JUNE)\s+(?:\d{1,2})/gmi,
  monthDelimiterDayRegex: /(?:january|jan|jan\.|february|feb|feb\.|march|mar|mar\.|april|apr|apr\.|may|jun|jun\.|june|july|jul\.|jul|august|aug|aug\.|sep|sep\.|sept|sept\.|september|october|oct|oct\.|november|nov|nov\.|december|dec|dec\.)\s+[\|]*\s*(?:\d{1,2}(?:\s*-\s*\d{1,2})?)/gmi,
  monthDayYearRegex: /([\d]{1,2}[-\/][\d]{1,2}[-\/][\d]{2,4})/gmi

  // no spaces - JUN17 JULY9
}

const currentYear: number = new Date().getFullYear();

abstract class DateHelper
{
  private static delimitersRegex = /(?:\||-|\/|\s|\.)+/gmi;

  private static stringToMonth(text: string): number | null
  {
    const month: string = text.toLowerCase().trim();
    switch (month)
    {
      case "jan":
      case "january":
      case "jan.":
        return 0;
      case "feb":
      case "february":
      case "feb.":
        return 1;
      case "mar":
      case "march":
      case "mar.":
        return 2;
      case "apr":
      case "april":
      case "apr.":
        return 3;
      case "may":
      case "may.":
        return 4;
      case "jun":
      case "june":
      case "jun.":
        return 5;
      case "jul":
      case "july":
      case "jul.":
        return 6;
      case "aug":
      case "august":
      case "aug.":
        return 7;
      case "sept":
      case "sep":
      case "september":
      case "sep.":
      case "sept.":
        return 8;
      case "oct":
      case "october":
      case "oct.":
        return 9;
      case "nov":
      case "november":
      case "nov.":
        return 10;
      case "dec":
      case "december":
      case "dec.":
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

  // public static makeDateSeekonk = (matchText: string): Date[] | null => {
  //   const pieces = matchText.split(" ");
  //   const month: number | null = DateHelper.stringToMonth(pieces[0]);
  //   const day = Number.parseInt(pieces[1], 10);
  //   return [DateHelper.makeDateBase(month, day)];
  // }

  public static makeDateMonthDayYear = (matchText: string): Date[] | null => {
    const pieces = matchText.split(DateHelper.delimitersRegex);
    const monthIndex: number = Number.parseInt(pieces[0], 10) - 1;
    const day = Number.parseInt(pieces[1], 10);
    // const year = Number.parseInt(pieces[2], 10);
    return [DateHelper.makeDateBase(monthIndex, day)];
  }

  public static makeDateMonthDelimiterDay = (matchText: string): Date[] | null => {
    const pieces = matchText.split(DateHelper.delimitersRegex);
    const monthIndex = DateHelper.stringToMonth(pieces[0]);

    // if pieces is 3, there's a dash in the day
    if (pieces.length === 3)
    {
      const dates: Date[] = [];
      const day1: number = Number.parseInt(pieces[1].trim(), 10);
      const day2: number = Number.parseInt(pieces[2].trim(), 10);

      for (let i: number = day1; i <= day2; i++)
      {
        dates.push(DateHelper.makeDateBase(monthIndex, i));
      }

      return dates;
    }
    if (pieces.length !== 2)
    {
      throw new Error("incorrectly parsed match text: " + matchText);
    }
    const day = Number.parseInt(pieces[1], 10);
    return [DateHelper.makeDateBase(monthIndex, day)];
  };
}

export type OcrFormat = {regex: RegExp, makeDate: (matchText: string) => Date[] | null};

export const Formats = {
  // seekonk: {
  //   regex: regexOptions.seekonkRegex,
  //   makeDate: DateHelper.makeDateSeekonk
  // },
  monthDayYear: {
    regex: regexOptions.monthDayYearRegex,
    makeDate: DateHelper.makeDateMonthDayYear
  },
  monthDelimiterDay: {
    regex: regexOptions.monthDelimiterDayRegex,
    makeDate: DateHelper.makeDateMonthDelimiterDay
  }
}

export abstract class Scraper
{
  private static dateTrackMap: Map<number, Set<string>> = new Map(); // key is Date.getTime()

  public static TESTPIN_guessFormat(sourceText: string): OcrFormat
  {
    return this.guessFormat(sourceText);
  }

  // take source data and figure out which format best represents it by trying all the regex and seeing
  // which gives more matches
  private static guessFormat(sourceText: string): OcrFormat
  {
    let format: OcrFormat;
    let count: number = 0;

    //tslint:disable
    for (const key in Formats)
    {
      // tslint:enable
      const value = (Formats as any)[key]; // TODO: type safety
      const groups = sourceText.match(value.regex);
      if (groups != null && groups.length > count) // this has more matches, so use it
      {
        count = groups.length;
        format = value;
      }
    }

    return format;
  }

  // URL entry point
  public static async readTextFromSource(url: string, trackName: string, format: OcrFormat | null = null): Promise<void>
  {
    if (url == null || url === undefined)
    {
      console.error("Cannot read text from source - source URL is null");
      return;
    }

    let text: string;
    if (url.endsWith("pdf"))
    {
      const response = await crawler(url);
      text = response.text;
    }
    else if (url.indexOf(".jpg") > -1) // TOOD: support more than jpg
    {
      text = await this.executeOCR(url, false);
    }
    else // webpage, do scraping
    {
      text = await this.executeScraping(url);
    }

    if (format == null)
    {
      format = this.guessFormat(text);
    }

    const dates: Date[] = this.guessDatesFromString(text, format);

    Scraper.addDatesForTrack(trackName, dates);
  }

  public static addTracksToDate(date: Date, trackNames: Set<string>): void
  {
    const existingTracks: Set<string> = this.dateTrackMap.get(date.getTime());
    this.dateTrackMap.set(date.getTime(), new Set([...existingTracks, ...trackNames]));
  }

  public static addDatesForTrack(trackName: string, dates: Date[]): void
  {
    dates.forEach((date: Date) => {
      const existingTracks: Set<string> | undefined = this.dateTrackMap.get(date.getTime());

      if (existingTracks === undefined) // just add the new track
      {
        this.dateTrackMap.set(date.getTime(), new Set<string>([trackName]));
        return;
      }

      // need to add the new track to the existing set of tracks

      this.dateTrackMap.set(date.getTime(), existingTracks.add(trackName));
    });
  }

  public static addDate(date: Date): void
  {
    this.dateTrackMap.set(date.getTime(), new Set<string>());
  }

  // if a date shows up in the OCR, we assume there's a race on that event
  // we can make a guess as to the classes and whatnot by looking at the rest of the line
  public static async executeOCR(url: string, log: boolean = false): Promise<string>
  {
    // short-circuit for testing
    if (url === seekonkUrl)
    {
      return seekonkTestString;
    }
    else if (url === waterfordUrl)
    {
      return waterfordTestString;
    }
    else if (url === grandRapidsUrl)
    {
      return grandRapidsTestString;
    }
    else if (url === staffordUrl)
    {
      return staffordTestString;
    }

    const { data: { text } } = await Tesseract.recognize(
      url, 'eng', { logger: (m1) => { if (log) console.log(m1) }}
    );
    return text;
  }

  public static guessDatesFromString(fullText: string, format: OcrFormat): Date[]
  {
    const possibleDates: Date[] = [];
    const groups: RegExpMatchArray | undefined = fullText.match(format.regex);
    if (groups === undefined || groups == null)
    {
      console.error("Cannot guess any dates");
      return [];
    }

    groups.forEach((group) => {
      const dates: Date[] | null = format.makeDate(group);
      if (dates != null)
      {
        dates.forEach((date: Date) => {
          possibleDates.push(date);
        })
      }
    });

    // console.log("Possible dates: ");
    // console.log(possibleDates)
    return possibleDates;
  }

  public static async executeScraping(url: string): Promise<string>
  {
    // https://www.freecodecamp.org/news/the-ultimate-guide-to-web-scraping-with-node-js-daa2027dcd3/
    const html = await rp(url);

    const $ = cheerio.load(html);
    cheerio('')

    return html;

    // const url = 'https://en.wikipedia.org/wiki/List_of_Presidents_of_the_United_States';

    // rp(url)
    //   .then((html) =>
    //   {
    //     console.log(cheerio('b > a', html).length);
    //     console.log(cheerio('b > a', html));
    //   })
    //   .catch((err) =>
    //   {
    //     // handle error
    //   });
  }
}
