import React from 'react';
import './App.css';
import {observer} from "mobx-react";
import {makeObservable, observable, runInAction, action} from "mobx";
import { DbError, DbRow, DbRowResponse } from './Types';

export class AppMachine
{
  @observable testData: any = null;
  @observable parseDocUrl: string | null = null;
  @observable parseDocTrackName: string | null = null;
  @observable eventDate: string = "";
  @observable eventDateRangeFrom: string = "";
  @observable eventDateRangeTo: string = "";
  @observable eventState: string = "NULL";
  @observable returnedRowsFromParseDocument: DbRowResponse | null = null;
  @observable state: string = "NULL";

  //used for toggling between date and date range
  @observable getForDateRadio: boolean = true; 

  @observable eventsForDate: any = null;
  @observable uniqueTracks: {trackname: string, state: string}[] | null = null;

  constructor()
  {
    makeObservable(this);
  }

  private async getRequest(url: string): Promise<any>
  {
    const raw = await fetch(url);
    return raw.json();
  }

  private async postRequest(url: string, data: any): Promise<any>
  {
    const testDataRaw = await fetch(url, {
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      // mode: 'cors', // no-cors, *cors, same-origin
      // cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      // credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      // redirect: 'follow', // manual, *follow, error
      // referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return testDataRaw.json();
  }

  public async addEvent(date: string, trackname: string, state: string): Promise<boolean>
  {
    return this.postRequest(
      "/api/events/add", 
      {date: date, trackname: trackname, state: state});
  }

  public async getEventForDate(date: string, state: string): Promise<any>
  {
    //For some reason, "2022-08-20" is a day behind, but "08-20-2022" is correct. I have no idea why
    //The date picker gives the former, so we need to convert it

    if (date.indexOf("|") > 0) //TODO: more specific validation
    {
      const ds: string[] = date.split("|");
      const d1 = ds[0].split("-");
      const d2 = ds[1].split("-");
      const fixedDate = `${d1[1]}-${d1[2]}-${d1[0]}|${d2[1]}-${d2[2]}-${d2[0]}`;

      if (state === "") //date only
      {
        return this.getRequest(`/api/events/dateRange/${fixedDate}`);
      }
      else
      {
        return this.getRequest(`/api/events/dateRange/${fixedDate}/state/${state}`);
      }
    }

    // const d = new Date(date); //formatted on server

    const pieces: string[] = date.split("-");
    const fixedDate = `${pieces[1]}-${pieces[2]}-${pieces[0]}`;
    if (state === "") //date only
    {
      return this.getRequest(`/api/events/${fixedDate}`);
    }
    else
    {
      return this.getRequest(`/api/events/${date}/state/${state}`);
    }
  }

  public async parseDocument(): Promise<DbRowResponse | null>
  {
    return this.postRequest(
      "/api/events/parseDocument", 
      {url: this.parseDocUrl, trackname: this.parseDocTrackName, state: this.state});
  }

  public async refreshUniqueTracks(): Promise<void>
  {
    const resultRaw = await fetch(`/api/tracks/distinct`);
    const result: {trackname: string, state: string}[] | null = await resultRaw.json();

    if (result !== null)
    {
      result.sort((first: {trackname: string, state: string}, second: {trackname: string, state: string}) => {
        const name1 = first.trackname[0];
        const name2 = second.trackname[0];
        const state1 = first.state;
        const state2 = second.state;

        //if first > second, return 1
        //if first < second, return -1
        //if first == second, return 0

        if (state1 < state2)
        {
          return -1;
        }
        else if (state1 > state2)
        {
          return 1;
        }
        else //same state
        {
          if (name1 < name2)
          {
            return -1;
          }
          else if (name1 > name2)
          {
            return 1;
          }
          return 0;
        }
      });
    }
    
    runInAction(() => this.uniqueTracks = result);
  }
}

export interface AppProps
{

}

@observer
class App extends React.Component<AppProps>
{
  private machine: AppMachine = new AppMachine();

  private async addEvent(): Promise<void>
  {
    const result: boolean = await this.machine.addEvent("2021-01-08", "Seekonk Speedway", "MA");
    runInAction(() => this.machine.testData = result);
  }

  private async submitUrl(): Promise<void>
  {
    const result: DbRowResponse | null = await this.machine.parseDocument();
    runInAction(() => this.machine.returnedRowsFromParseDocument = result);
  }

  private async submitGetEventsForDate(): Promise<void>
  {
    let dateString = "";
    if (this.machine.getForDateRadio) //single date
    {
      if (this.machine.eventDate === "")
      {
        throw new Error("eventDate must be defined");
      }
      dateString = this.machine.eventDate;
    }
    else //date range
    {
      if (this.machine.eventDateRangeFrom === "" || this.machine.eventDateRangeTo === "")
      {
        throw new Error("eventDate must be defined");
      }
      dateString = this.machine.eventDateRangeFrom + "|" + this.machine.eventDateRangeTo;
    }

    const result = await this.machine.getEventForDate(dateString, this.machine.eventState);

    let rows: any[];
    if (result.rows.length === 0)
    {
      rows = [];
    }
    else
    {
      rows = result.rows;
    }


    runInAction(() => this.machine.eventsForDate = rows);
  }

  private async refreshUniqueTracks(): Promise<void>
  {
    this.machine.refreshUniqueTracks();
  }

  private onParseDocumentUrlChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.parseDocUrl = event.currentTarget.value);
  };

  private onParseDocumentTrackNameChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.parseDocTrackName = event.currentTarget.value);
  };

  private onGetEventForDateDateChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.eventDate = event.currentTarget.value);
  }

  private onGetEventForDateRangeFromChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.eventDateRangeFrom = event.currentTarget.value);
  }

  private onGetEventForDateRangeToChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.eventDateRangeTo = event.currentTarget.value);
  }

  private onGetEventForStateStateChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.eventState = event.currentTarget.value);
  }

  componentDidMount()
  {
    // this.addEvent();
  }

  private renderStateSelect(value: string, 
    onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void): JSX.Element
  {
    return <select value={value} onChange={onChange}>
      <option value="NULL">Select...</option>
      <option value="AL">Alabama</option>
      <option value="AK">Alaska</option>
      <option value="AZ">Arizona</option>
      <option value="AR">Arkansas</option>
      <option value="CA">California</option>
      <option value="CO">Colorado</option>
      <option value="CT">Connecticut</option>
      <option value="DE">Delaware</option>
      <option value="DC">District of Columbia</option>
      <option value="FL">Florida</option>
      <option value="GA">Georgia</option>
      <option value="HI">Hawaii</option>
      <option value="ID">Idaho</option>
      <option value="IL">Illinois</option>
      <option value="IN">Indiana</option>
      <option value="IA">Iowa</option>
      <option value="KS">Kansas</option>
      <option value="KY">Kentucky</option>
      <option value="LA">Louisiana</option>
      <option value="ME">Maine</option>
      <option value="Maryland">Maryland</option>
      <option value="MA">Massachusetts</option>
      <option value="MI">Michigan</option>
      <option value="MN">Minnesota</option>
      <option value="MO">Missouri</option>
      <option value="MT">Montana</option>
      <option value="NE">Nebraska</option>
      <option value="Nevada">NV</option>
      <option value="NH">New Hampshire</option>
      <option value="NJ">New Jersey</option>
      <option value="NM">New Mexico</option>
      <option value="NY">New York</option>
      <option value="NC">North Carolina</option>
      <option value="ND">North Dakota</option>
      <option value="OH">Ohio</option>
      <option value="OK">Oklahoma</option>
      <option value="OR">Oregon</option>
      <option value="PA">Pennsylvania</option>
      <option value="RI">Rhode Island</option>
      <option value="SC">South Carolina</option>
      <option value="SD">South Dakota</option>
      <option value="TN">Tennessee</option>
      <option value="TX">Texas</option>
      <option value="UT">Utah</option>
      <option value="VT">Vermont</option>
      <option value="VA">Virginia</option>
      <option value="WA">Washington</option>
      <option value="WV">West Virginia</option>
      <option value="WI">Wisconsin</option>
      <option value="WY">Wyoming</option>
    </select>;
  }

  private renderDbRows(rows: DbRow[] | null): JSX.Element
  {
    if (rows == null)
    {
      return <></>;
    }
    return <div>
      {
        rows.map((row: DbRow) => {
          return <React.Fragment key={row.id}>
            <div>
              {row.trackname}:&nbsp;
              {row.eventdate}
            </div>
            <br/>
          </React.Fragment>;
        })
      }
    </div>
  }

  private renderTracksList(rows: DbRow[] | null): JSX.Element
  {
    if (rows == null)
    {
      return <></>;
    }

    //TODO: sort rows


    return <div>
      {
        rows.map((row: any) => {
          return <div key={row.id ?? row}>{row.trackname}</div>;
        })
      }
    </div>
  }

  private renderTestDataSection(): JSX.Element
  {
    return <>
      The value returned from the server is:
      {this.machine.testData}
      <br/>
    </>
  }

  private renderParseDocumentSection(): JSX.Element
  {
    return <>
      <label htmlFor="parseDocumentInput">Parse Document (URL or text):</label>&nbsp;
      <input type="text" name="parseDocumentInput" id="parseDocumentInput" onChange={this.onParseDocumentUrlChange}/>
      <br/>
      <label htmlFor="parseDocumentTrackName">Track Name:</label>&nbsp;
      <input type="text" 
        name="parseDocumentTrackName" 
        id="parseDocumentTrackName" 
        onChange={this.onParseDocumentTrackNameChange}
      />
      &nbsp;State: {this.renderStateSelect(
        this.machine.state, 
        (e) => runInAction(() => this.machine.state = e.target.value)
      )}

      <br/>
      <button disabled={this.machine.state === "NULL" || 
                        this.machine.parseDocUrl === "" || 
                        this.machine.parseDocTrackName === ""} 
        onClick={() => this.submitUrl()}
      >
        Submit
      </button>
      <button onClick={() => {
        (document.getElementById("parseDocumentTrackName") as HTMLInputElement).value = "";
        (document.getElementById("parseDocumentInput") as HTMLInputElement).value = "";
        runInAction(() => this.machine.returnedRowsFromParseDocument = null);
      }}>Clear</button>
      <br/>
      {
        this.machine.returnedRowsFromParseDocument?.error != null &&
        <>
          Failed to add rows.
          <br/>
          Message: {this.machine.returnedRowsFromParseDocument.error.message}
        </>
      }
      {
        this.machine.returnedRowsFromParseDocument?.rows && 
        <>
          Inserted {this.machine.returnedRowsFromParseDocument.rows.length} rows.
          <br/>
          {this.renderDbRows(this.machine.returnedRowsFromParseDocument.rows)}
        </>
      }
    </>
  }

  //TODO: clear results when radio buttons are changed
  private renderGetEventsSection(): JSX.Element
  {
    let titleString = "";
    if (this.machine.getForDateRadio && this.machine.eventDate)
    {
      if (this.machine.eventState !== "NULL")
      {
        titleString = `Date: ${this.machine.eventDate}, State: ${this.machine.eventState}`;
      }
      else
      {
        titleString = `Date: ${this.machine.eventDate}`;
      }
    }
    else if (!this.machine.getForDateRadio && this.machine.eventDateRangeFrom && this.machine.eventDateRangeTo)
    {
      titleString = `Date: ${this.machine.eventDateRangeFrom} to ${this.machine.eventDateRangeTo}`;
      if (this.machine.eventState !== "NULL")
      {
        titleString += `, ${this.machine.eventState}`;
      }
    }

    const singleDate: JSX.Element = <>
      <label htmlFor="getEventsForDateInput">Single Date: </label>
      <input type="date" 
        name="getEventsForDateInput" 
        value={this.machine.eventDate} 
        onChange={this.onGetEventForDateDateChange}
      />
      <br/>
    </>;
    
    const dateRange: JSX.Element = <>
      <label htmlFor="getEventsForDateRangeFromInput">Date Range: </label>
      <input type="date" 
        name="getEventsForDateRangeFromInput" 
        value={this.machine.eventDateRangeFrom} 
        onChange={this.onGetEventForDateRangeFromChange}
      /> to <input type="date" 
        name="getEventsForDateRangeToInput" 
        value={this.machine.eventDateRangeTo} 
        onChange={this.onGetEventForDateRangeToChange}
      />
      <br/>
    </>;

    return <>
      Get all events for:<br/>

      <input type="radio" 
        name="singleDateRadio" 
        checked={this.machine.getForDateRadio}
        onChange={(e) => {
          runInAction(() => this.machine.getForDateRadio = e.currentTarget.checked);
        }}
      />
      <label htmlFor="singleDateRadio">Single Date</label>
      <input type="radio" 
        name="dateRangeRadio" 
        checked={!this.machine.getForDateRadio}
        onChange={(e) => {
          runInAction(() => this.machine.getForDateRadio = !e.currentTarget.checked);
        }}
      />
      <label htmlFor="dateRangeRadio">Date Range</label>
      <br/>

      {
        this.machine.getForDateRadio &&
        singleDate
      }
      {
        !this.machine.getForDateRadio &&
        dateRange
      }

      <br/>
      <label htmlFor="getEventsForStateInput">State: </label>
      {/* <input type="text" name="getEventsForStateInput" onChange={this.onGetEventForStateStateChange}/> */}
      {this.renderStateSelect(
        this.machine.eventState, 
        (e) => runInAction(() => this.machine.eventState = e.currentTarget.value)
      )}
      <br/>
      <button onClick={() => this.submitGetEventsForDate()}
        disabled={this.machine.getForDateRadio 
          ? this.machine.eventDate === "" 
          : this.machine.eventDateRangeFrom === "" || this.machine.eventDateRangeTo === ""
        }
      >
        Submit
      </button>

      <br/>
      {
        titleString !== "" &&
          <>
            {titleString}
            <br/>
            <br/>
          </>
      }
      {
        this.machine.eventsForDate != null &&
        this.renderTracksList(this.machine.eventsForDate)
      }
      {
        this.machine.eventsForDate != null && this.machine.eventsForDate.length === 0 &&
        <>No Races Found</>
      }
    </>
  }

  private renderUniqueTracksSection(): JSX.Element
  {
    return <>
      Unique Tracks: <button onClick={() => this.refreshUniqueTracks()}>Refresh</button>
      {
        this.machine.uniqueTracks != null &&
        <>
          {
            this.machine.uniqueTracks.map((track: {trackname: string, state: string}) => {
              return <div key={track.trackname}>{track.trackname}, {track.state}</div>;
            })
          }
        </>
      }
    </>;
  }

  render()
  {
    return <div className="App">
      <br/>
      {/* {this.renderTestDataSection()}
      <hr/> */}

      {this.renderParseDocumentSection()}
      <hr/>

      {this.renderGetEventsSection()}
      <hr/>

      {this.renderUniqueTracksSection()}

      <br/>
      {this.renderFooter()}
    </div>
  }

  private renderFooter(): JSX.Element
  {
    return <>
      <br/>
      <div className="footer">
      Site designed by Dirk Stahlecker | Copyright {new Date().getFullYear()} | 
      Contact: <a href="mailto:trackchaserDirk@gmail.com">trackchaserDirk@gmail.com</a>
    </div>
  </>;
  }
}

export default App;

//TODO: VERIFY INPUT DATES ARE ACCURATE AND NOT AFFECTED BY WEIRD OFF BY ONE ERRORS

//TODO: indicate in UI when no dates were added because they already exist
