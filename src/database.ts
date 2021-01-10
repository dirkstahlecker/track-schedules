import { Pool, QueryResult } from 'pg'
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



  // Expects a single row. If more than 1, throw and error. If 0, return null
  public static async getEventForTrackAndDate(date: string, trackName: string): Promise<DbRow | null>
  {
    const query: string = `SELECT * FROM dateandtrack WHERE eventdate='${date}'
      AND trackname='${trackName}';`;
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

  // returns success
  public static async addEvent(date: string, trackName: string): Promise<boolean>
  {
    // verify that this combination hasn't already been inserted
    const getResult = Database.getEventForTrackAndDate(date, trackName);
    if (getResult != null)
    {
      console.log("Did not add event - date and trackname combination already exists");
      return false;
    }

    const insertQuery: string = `INSERT INTO dateandtrack (eventDate, trackName) VALUES
      ('${date}', '${trackName}');`;
    return this.makeQuery(insertQuery);
  }

  public static async getEventsForDate(date: string): Promise<any>
  {
    const query: string = `SELECT * FROM dateandtrack WHERE eventdate='${date}';`;
    return Database.makeQuery(query);
  }
}
