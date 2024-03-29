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
  trackname: string,
  state: string
};

export class DbRowResponse
{
  constructor(public rows: DbRow[], public error: DbError | null)
  {}

  public static withError(errorMessage: string): DbRowResponse
  {
    return new DbRowResponse([], new DbError(errorMessage));
  }

  public static withRows(rows: DbRow[]): DbRowResponse
  {
    return new DbRowResponse(rows, null);
  }
}

// export const makeDbRow = (json: any): DbRow => {

//   return {
//     id: json.id,
//     eventdate: new Date(json.eventdate),
//     trackname: json.trackname
//   }
// }

export class DbError
{
  constructor(public message: string, public fatal: boolean = false)
  {
    console.error(message);
  }
}

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
  public static async addEvents(dates_in: string[], trackNames_in: string[], states_in: string[]): Promise<DbRowResponse | null>
  {
    // TODO: verify date string format
    if (dates_in.length !== trackNames_in.length)
    {
      throw new Error("Cannot add events - dates and tracknames aren't equal length");
    }

    if (dates_in.length === 0)
    {
      return DbRowResponse.withError("Nothing added - dates_in is empty.");
    }

    console.log(`dates_in to add to database: ${dates_in}`);

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
      return DbRowResponse.withError("Nothing to add - everything exists already");
    }

    let valuesStr: string = "";
    for (let ii: number = 0; ii < dates.length; ii++)
    {
      valuesStr += ` ('${dates[ii]}', '${tracknames[ii]}', '${states_in[ii]}')${ii < dates.length - 1 ? "," : ""}`;
    }

    const insertQuery: string = `INSERT INTO dateandtrack (eventDate, trackName, state) VALUES
      ${valuesStr} RETURNING *;`;
    const result = await this.makeQuery(insertQuery);
    return DbRowResponse.withRows(result.rows);
  }

  // DATE MUST BE FORMATTED yyy-mm-dd
  public static async getEventsForDate(date: string, state: string | null): Promise<any>
  {
    // format the date
    console.log(`before formatting: ${date}`)
    // const formattedDate: string = DateHelper.convertDateObjToDatabaseDateString(new Date(date));

    let query: string = `SELECT * FROM dateandtrack WHERE eventdate='${date}'`;
    if (state != null && state !== "" && state.length === 2)
    {
      query += ` AND state='${state}'`;
    }
    query += ";";
    return Database.makeQuery(query);
  }

  // separated by |
  public static async getEventsForDateRange(dateRange: string, state: string | null): Promise<any>
  {
    const dates: string[] = dateRange.split("|");
    if (dates.length !== 2)
    {
      throw new Error(`Invalid dateRange ${dateRange}`);
    }

    // format the date
    const date1: string = DateHelper.convertDateObjToDatabaseDateString(new Date(dates[0]));
    const date2: string = DateHelper.convertDateObjToDatabaseDateString(new Date(dates[1]));

    let query: string = `SELECT * FROM dateandtrack WHERE eventdate>='${date1}' AND eventDate<='${date2}'`;
    if (state != null && state !== "" && state.length === 2)
    {
      query += ` AND state='${state}'`;
    }
    query += ";";
    return Database.makeQuery(query);
  }

  public static async deleteEvent(date: string, trackname: string): Promise<void>
  {
    const deleteQuery: string = `DELETE FROM dateandtrack
      WHERE eventdate='${date}' AND LOWER(trackname)=LOWER('${this.cleanseTracknameForDB(trackname)}');`;
    return Database.makeQuery(deleteQuery);
  }

  public static async getUniqueTracks(): Promise<{trackname: string, state: string}[]>
  {
    const query: string = `SELECT DISTINCT trackname, state FROM dateandtrack;`;
    const result = await Database.makeQuery(query);

    const strings: {trackname: string, state: string}[] = [];
    result.rows.forEach((row: any) => {
      strings.push({trackname: row.trackname, state: row.state})
    })

    return strings;
  }
}
