import Tesseract from 'tesseract.js';
import rp from 'request-promise';
import cheerio from 'cheerio';
import { grandRapidsTestString, seekonkTestString, staffordTestString, waterfordTestString } from './ocrTestString';
import { grandRapidsUrl, seekonkUrl, staffordUrl, waterfordUrl } from './server';
import { Database, DbRow } from './database';
//tslint:disable
const crawler = require('crawler-request');
// tslint:enable


// Regex should return groups that are the full date
const regexOptions = {
  // seekonkRegex: /(?:JUN|JULY|AUG|SEPT|OCT|NOV|DEC|JUN|JUL|JAN|FEB|MAR|APR|MAY|JUNE)\s+(?:\d{1,2})/gmi,
  monthDelimiterDayRegex: /((?:january|jan|jan\.|february|feb|feb\.|march|mar|mar\.|april|apr|apr\.|may|jun|jun\.|june|july|jul\.|jul|august|aug|aug\.|sep|sep\.|sept|sept\.|september|october|oct|oct\.|november|nov|nov\.|december|dec|dec\.)\s*[\|]*\s*(?:\d{1,2}[st|nd|rd|th]*(?:\s*-\s*\d{1,2}[st|nd|rd|th]*)?))(?:[^\d])/gmi,
  dayDelimiterMonthRegex: /((?:\d{1,2})\s*[-|]?\s*(?:january|jan|jan\.|february|feb|feb\.|march|mar|mar\.|april|apr|apr\.|may|jun|jun\.|june|july|jul\.|jul|august|aug|aug\.|sep|sep\.|sept|sept\.|september|october|oct|oct\.|november|nov|nov\.|december|dec|dec))/gmi,
  monthDayYearRegex: /([\d]{1,2}[-\/][\d]{1,2}[-\/][\d]{2,4})/gmi,
  // monthDelimiterDay2:

  // no spaces - JUN17 JULY9
  // July 2 and 3
  // July 2 & 3
  // July 2nd & 3rd

}

// (?:\s*-\s*\d{1,2})?

/**
 * If there aren't at least this many matches when guessing regex, declare failure and give up
 */
const MIN_MATCHES_TO_USE_FORMAT: number = 5;

// TODO: make this changeable or something
const currentYear: number = 2022; // new Date().getFullYear();

export function TESTPIN_convertDateObjToDatabaseDateString(date: Date): string
{
  return DateHelper.convertDateObjToDatabaseDateString(date);
}

export abstract class DateHelper
{
  private static delimitersRegex = /(?:\||-|\/|\s|\.)+/gmi;

  private static stringToMonthIndex(text: string): number | null
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

  public static isValidDate(dateStr: string): boolean
  {
    const parts = dateStr.split("-");
    const year: number = Number.parseInt(parts[0], 10);
    const month: number = Number.parseInt(parts[1], 10)
    const day: number = Number.parseInt(parts[2], 10);

    const isLeapYear: boolean = ((year % 4 === 0) && (year % 100 !== 0)) || (year % 400 === 0);
    switch (month)
    {
      case 1: // jan
        return day <= 31;
      case 2: // feb
        if (isLeapYear)
        {
          return day <= 29;
        }
        return day <= 28;
      case 3: // mar
        return day <= 31;
      case 4: // apr
        return day <= 30;
      case 5: // may
        return day <= 31;
      case 6: // jun
        return day <= 30;
      case 7: // jul
        return day <= 31;
      case 8: // aug
        return day <= 31;
      case 9: // sep
        return day <= 30;
      case 10: // oct
        return day <= 31;
      case 11: // nov
        return day <= 30;
      case 12: // dec
        return day <= 31;
      default:
        return false;
    }
  }

  // return a string in the proper format for the database: YYYY-MM-DD
  private static makeDateBase(monthIndex: number | null, day: number | null, year: number = currentYear): string | null
  {
    // console.log(`monthIndex: ${monthIndex}, day: ${day}, year: ${year}`)
    if (monthIndex == null || day == null)
    {
      console.error(`Cannot make date - invalid arguments. month: ${monthIndex}, day: ${day}, year: ${year}`);
      return null;
    }

    return this.convertNumbersToDatabaseDateString(monthIndex, day, year);
  }

  // public static makeDateSeekonk = (matchText: string): Date[] | null => {
  //   const pieces = matchText.split(" ");
  //   const month: number | null = DateHelper.stringToMonth(pieces[0]);
  //   const day = Number.parseInt(pieces[1], 10);
  //   return [DateHelper.makeDateBase(month, day)];
  // }

  public static makeDateMonthDayYear = (matchText: string): Set<string> | null => {
    const pieces = matchText.split(DateHelper.delimitersRegex);
    const monthIndex: number = Number.parseInt(pieces[0], 10) - 1;
    const day = Number.parseInt(pieces[1], 10);
    // const year = Number.parseInt(pieces[2], 10);
    const r = new Set<string>();
    r.add(DateHelper.makeDateBase(monthIndex, day));
    console.log("r:")
    console.log(r)
    return r;
  }

  public static makeDateMonthDelimiterDay = (matchText: string): Set<string> | null => {
    const rawPieces = matchText.split(DateHelper.delimitersRegex);
    if (Number.parseInt(rawPieces[0], 10) > 12)
    {
      console.log(`month is coming in as ${rawPieces[0]}`)
    }
    const monthIndex = DateHelper.stringToMonthIndex(rawPieces[0]);

    const pieces = rawPieces.filter((value: string) => {
      return value !== "";
    })
    // console.log(`pieces: ${pieces}`)

    // if pieces is 3, there's a dash in the day
    if (pieces.length === 3)
    {
      const dates: Set<string> = new Set();
      const day1: number = Number.parseInt(pieces[1].trim(), 10);
      const day2: number = Number.parseInt(pieces[2].trim(), 10);

      for (let i: number = day1; i <= day2; i++)
      {
        const d = DateHelper.makeDateBase(monthIndex, i);
        // console.log(d)
        dates.add(d);
      }

      return dates;
    }

    if (pieces.length !== 2)
    {
      throw new Error("incorrectly parsed match text: " + matchText);
    }
    const day = Number.parseInt(pieces[1], 10);

    const ret = new Set<string>();
    ret.add(DateHelper.makeDateBase(monthIndex, day));
    return ret;
  };

  public static makeDateDayDelimiterMonth = (matchText: string): string[] | null => {
    const pieces = matchText.split(DateHelper.delimitersRegex);
    if (pieces.length !== 2)
    {
      throw new Error("Incorrectly parsed match text: " + matchText);
    }
    const monthIndex = DateHelper.stringToMonthIndex(pieces[1]);
    const day = Number.parseInt(pieces[0], 10);
    return [DateHelper.makeDateBase(monthIndex, day)];
  };

  public static convertNumbersToDatabaseDateString(monthIndex_in: number, day_in: number, year_in: number = currentYear): string
  {
    monthIndex_in += 1;
    let month: string = String(monthIndex_in);
    let day: string = String(day_in);
    if (monthIndex_in < 10)
    {
      month = `0${monthIndex_in}`;
    }
    if (day_in < 10)
    {
      day = `0${day_in}`;
    }

    const ret = `${year_in}-${month}-${day}`;

    return ret;
  }

  public static convertDateObjToDatabaseDateString(date: Date): string
  {
    const year: number = date.getFullYear();
    const monthIndex: number | string = date.getMonth();
    const day: number | string = date.getDate();
    return this.convertNumbersToDatabaseDateString(monthIndex, day, year);
  }
}

// TODO: rename
export type OcrFormat = {name: string, regex: RegExp, makeDate: (matchText: string) => Set<string> | null};

export const Formats = {
  // seekonk: {
  //   regex: regexOptions.seekonkRegex,
  //   makeDate: DateHelper.makeDateSeekonk
  // },
  monthDayYear: {
    name: "monthDayYear",
    regex: regexOptions.monthDayYearRegex,
    makeDate: DateHelper.makeDateMonthDayYear
  },
  monthDelimiterDay: {
    name: "monthDelimiterDay",
    regex: regexOptions.monthDelimiterDayRegex,
    makeDate: DateHelper.makeDateMonthDelimiterDay
  },
  dayDelimiterMonth: {
    name: "dayDelimiterMonth",
    regex: regexOptions.dayDelimiterMonthRegex,
    makeDate: DateHelper.makeDateDayDelimiterMonth
  }

  // TODO: Figure out how to deal with month only being at the beginning of the month like selinsgrove
  // http://www.selinsgrovespeedway.com/images/2021_Speedway_Schedule.pdf
  // https://hagerstownspeedway.com/index.php/schedule/

}

export abstract class Scraper
{
  // deprecated - use database instead
  private static dateTrackMap: Map<number, Set<string>> = new Map(); // key is Date.getTime()

  public static TESTPIN_guessFormat(sourceText: string): OcrFormat
  {
    return this.guessFormat(sourceText);
  }

  // take source data and figure out which format best represents it by trying all the regex and seeing
  // which gives more matches
  private static guessFormat(sourceText: string): OcrFormat | null
  {
    let format: OcrFormat | null = null;
    let count: number = MIN_MATCHES_TO_USE_FORMAT; // need to have at least this many matches to count

    //tslint:disable
    for (const key in Formats)
    {
      // tslint:enable
      const value: OcrFormat = (Formats as any)[key]; // TODO: type safety
      const groups = sourceText.match(value.regex);

      if (groups != null && groups.length > count) // this has more matches, so use it
      {
        count = groups.length;
        format = value;
      }
    }

    if (format == null)
    {
      return null;
    }
    return format;
  }

  // remove things that can confuse the parsing
  public static cleanText(text: string): string
  {
    const cleanseTextRegex = /(?:[\d]{1,2}:[\d]{2})\s*(?:[P|A]M)?/gi;
    // remove times so they're not confused with dates
    const cleaned = text.replace(cleanseTextRegex, "");
    return cleaned;
  }

  // URL entry point
  public static async readTextFromSource(urlOrText: string, trackName: string, state: string, format: OcrFormat | null = null): Promise<DbRow[] | null>
  {
    if (urlOrText == null || urlOrText === undefined || urlOrText === "")
    {
      console.error("Cannot read text from source - source text is blank or null");
      return;
    }

    const imageExtensionsRegex = /(?:\.png)|(?:\.jpg)/gmi; // TODO: support more extensions

    urlOrText = urlOrText.trim();
    let text: string;
    if (urlOrText.match(/\s+/g) != null) // there are spaces, so treat as text not URL
    {
      text = urlOrText; // just use the text
    }
    else if (urlOrText.endsWith("pdf")) // PDF
    {
      const response = await crawler(urlOrText);
      text = response.text;
    }
    else if (urlOrText.match(imageExtensionsRegex) != null) // image
    {
      text = await this.executeOCR(urlOrText, true);
    }
    else // webpage, do scraping
    {
      text = await this.executeScraping(urlOrText);
    }

    if (text === undefined || text === "")
    {
      console.log("Failed to parse text.");
      return null;
    }

    if (format == null)
    {
      format = this.guessFormat(text);
      if (format == null)
      {
        console.log("Failed to locate a suitable format.");
        return null;
      }
      console.log(`opted for format ${format.name} with regex: ${format.regex}`);
    }

    text = this.cleanText(text);

    const dates: Set<string> | null = this.guessDatesFromString(text, format);
    if (dates == null)
    {
      return null;
    }

    const tracknames: string[] = [];
    const convertedDates: string[] = [];
    const states: string[] = [];
    dates.forEach((d: string) => {
      // change from Date object to date string for DB
      convertedDates.push(d);

      // add an element to the trackname array for each date, so they're the same length
      tracknames.push(trackName);
      states.push(state);
    });

    return Database.addEvents(convertedDates, tracknames, states);

    // Scraper.addDatesForTrack(trackName, dates); // deprecated - use database instead
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
    if (log)
    {
      console.log("Returning the following text from OCR:")
      console.log(text);
    }
    return text;
  }

  public static guessDatesFromString(fullText: string, format: OcrFormat): Set<string> | null
  {
    fullText = fullText + "\n"; // hack around regex that requires something after the last thing to capture dates with a dash
    const possibleDates: Set<string> = new Set();
    const groups: IterableIterator<RegExpMatchArray> | undefined = fullText.matchAll(format.regex);
    if (groups === undefined || groups == null)
    {
      console.error("Cannot guess any dates");
      return null;
    }

    const groupsArray = Array.from(groups);
    groupsArray.forEach((group: RegExpMatchArray) => {
      const dates: Set<string> | null = format.makeDate(group[0]);
      if (dates != null)
      {
        dates.forEach((date: string) => {
          console.log(`date: ${date}`)

          if (!DateHelper.isValidDate(date)) // the database will crash if given an invalid date
          {
            console.error(`INVALID DATE - not adding ${date}`)
          }
          else
          {
            possibleDates.add(date);
          }
        })
      }
    });

    // console.log("Possible dates: ");
    // console.log(possibleDates)
    return possibleDates;

    // return possibleDates;
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
