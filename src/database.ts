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

export class Database
{
  // wrapper to make a query and do error handling
  private static async makeQuery(query: string): Promise<any>
  {
    try
    {
      const result = await pool.query(query);
      return result;
    }
    catch (e)
    {
      console.error("ERROR with query " + query);
      throw e;
    }
  }

  public static async addDate(date: string): Promise<any>
  {
    const insertQuery: string = `INSERT INTO dates (eventDate) VALUES
      ('${date}');`;
    return this.makeQuery(insertQuery);
  }

  public static async getDate(date: string): Promise<any>
  {
    const query: string = 'SELECT * FROM dates';
    const result = await Database.makeQuery(query);
  }
}
