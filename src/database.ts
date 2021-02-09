import { values } from 'mobx';
import { Pool, QueryResult } from 'pg'
import { DateHelper } from './scraper';
//tslint:disable
const pg = require('pg');
// tslint:enable

export type DisplayNameInfo = { name_id: number, displayname: string };
export type FullNameInfo = { displayname: string, firstname: string | null, lastname: string | null };

// https://blog.logrocket.com/nodejs-expressjs-postgresql-crud-rest-api-example/

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////
// Don't touch the following - Heroku gets very finnicky about it

const connString = process.env.DATABASE_URL || 'postgresql://dirkstahlecker@localhost:5432/trackschedules';

let pool: Pool;
if (process.env.DATABASE_URL)
{
  pool = new Pool({
    connectionString : connString,
    ssl: { rejectUnauthorized: false }
  });
}
else
{
  pool = new Pool({
    connectionString: connString
  });
}

/////////////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////////////

export type DbRow = {
  id: number,
  eventdate: Date,
  trackname: string
};

// export const makeDbRow = (json: any): DbRow => {

//   return {
//     id: json.id,
//     eventdate: new Date(json.eventdate),
//     trackname: json.trackname
//   }
// }

export class Database
{
  // wrapper to make a query and do error handling
  private static async makeQuery(query: string, nullIfError: boolean = false): Promise<any>
  {
    try
    {
      const result = await pool.query(query);
      return result;
    }
    catch (e)
    {
      if (nullIfError)
      {
        return null;
      }
      console.error("ERROR with query " + query);
      throw e;
    }
  }

  private static cleanseTracknameForDB(trackname: string): string
  {
    const cleanseForDbRegex = /[']/gmi;
    return trackname.replace(cleanseForDbRegex, "");
  }


  // Expects a single row. If more than 1, throw and error. If 0, return null
  public static async getEventForTrackAndDate(date: string, trackName: string): Promise<DbRow | null>
  {
    const query: string = `SELECT * FROM dateandtrack WHERE eventdate='${date}'
      AND LOWER(trackname)=LOWER('${this.cleanseTracknameForDB(trackName)}');`;
    const result = await Database.makeQuery(query, true);

    if (result == null || result.rows.length === 0)
    {
      return null;
    }
    else if (result.rows.length !== 1)
    {
      throw new Error(`DB Invariant: more than one row for ${date} and ${trackName}`);
    }
    return Promise.resolve(result.rows[0]);
  }

  // returns added rows
  public static async addEvents(dates_in: string[], trackNames_in: string[]): Promise<DbRow[] | null>
  {
    // TODO: verify date string format
    if (dates_in.length !== trackNames_in.length)
    {
      throw new Error("Cannot add events - dates and tracknames aren't equal length");
    }

    if (dates_in.length === 0)
    {
      console.error("Nothing added - dates_in is empty.");
      return null;
    }

    console.log(`dates_in: ${dates_in}`);

    const dates: string[] = [];
    const tracknames: string[] = [];

    // check if any of them exist already
    for (let i: number = 0; i < dates_in.length; i++)
    {
      const d: string = dates_in[i];
      const t: string = trackNames_in[i]

      // verify that this combination hasn't already been inserted
      // if it hasn't, add it to the list to insert
      const getResult = await Database.getEventForTrackAndDate(d, t);
      if (getResult == null) // doesn't exist, need to add
      {
        dates.push(d);
        tracknames.push(this.cleanseTracknameForDB(t));
      }
      else
      {
        console.log("Did not add event - date and trackname combination already exists");
      }
    }

    if (dates.length === 0)
    {
      console.log("Nothing to add - everything exists already")
      return null;
    }

    let valuesStr: string = "";
    for (let ii: number = 0; ii < dates.length; ii++)
    {
      valuesStr += ` ('${dates[ii]}', '${tracknames[ii]}')${ii < dates.length - 1 ? "," : ""}`;
    }

    const insertQuery: string = `INSERT INTO dateandtrack (eventDate, trackName) VALUES
      ${valuesStr} RETURNING *;`;
    const result = await this.makeQuery(insertQuery);
    return result.rows;
  }

  public static async getEventsForDate(date: string): Promise<any>
  {
    // format the date
    const formattedDate: string = DateHelper.convertDateObjToDatabaseDateString(new Date(date));

    const query: string = `SELECT * FROM dateandtrack WHERE eventdate='${formattedDate}';`;
    return Database.makeQuery(query);
  }

  public static async deleteEvent(date: string, trackname: string): Promise<void>
  {
    const deleteQuery: string = `DELETE FROM dateandtrack
      WHERE eventdate='${date}' AND LOWER(trackname)=LOWER('${this.cleanseTracknameForDB(trackname)}');`;
    return Database.makeQuery(deleteQuery);
  }

  public static async getUniqueTracks(): Promise<string[]>
  {
    const query: string = `SELECT DISTINCT trackname FROM dateandtrack;`;
    const result = await Database.makeQuery(query);

    const strings: string[] = [];
    result.rows.forEach((row: any) => {
      strings.push(row.trackname)
    })

    return strings;
  }
}
