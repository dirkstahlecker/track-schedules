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
  @observable eventDate: string | null = null;
  @observable eventState: string | null = null;
  @observable returnedRowsFromParseDocument: DbRowResponse | null = null;
  @observable state: string = "MA";

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

  public async getEventForDate(date: string): Promise<any>
  {
    const d = new Date(date);
    return this.getRequest(`/api/events/${d}`)
  }

  public async getEventForState(state: string): Promise<any>
  {
    return this.getRequest(`/api/events/state/${state}`)
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
    const result = await this.machine.getEventForDate(this.machine.eventDate!!);
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

  //TODO: copied from above
  private async submitGetEventsForState(): Promise<void>
  {
    const result = await this.machine.getEventForState(this.machine.eventState!!);
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


  private onGetEventForStateStateChange = (event: React.FormEvent<HTMLInputElement>): void => {
    runInAction(() => this.machine.eventState = event.currentTarget.value);
  }

  componentDidMount()
  {
    // this.addEvent();
  }

  private renderStateSelect(): JSX.Element
  {
    return <select value={this.machine.state} onChange={(e) => {
      runInAction(() => this.machine.state = e.target.value);
    }}>
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
          return <React.Fragment key="row">
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
          return <div>{row.trackname}</div>;
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
      &nbsp;State: {this.renderStateSelect()}
      <br/>
      <button onClick={() => this.submitUrl()}>Submit</button>
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

  private renderGetEventsSection(): JSX.Element
  {
    return <>
      Get events for date:<br/>
      <label htmlFor="getEventsForDateInput">Date: </label>
      <input type="text" name="getEventsForDateInput" onChange={this.onGetEventForDateDateChange}/>
      <button onClick={() => this.submitGetEventsForDate()}>Submit</button>
      <br/>
      Get events for State:<br/>
      <label htmlFor="getEventsForStateInput">State: </label>
      <input type="text" name="getEventsForStateInput" onChange={this.onGetEventForStateStateChange}/>
      <button onClick={() => this.submitGetEventsForState()}>Submit</button>
      <br/>

      <br/>
      {
        this.machine.eventDate != null &&
          <>
            Date:
            {this.machine.eventDate}
          </>
      }
      {
        this.machine.eventsForDate != null &&
        this.renderTracksList(this.machine.eventsForDate)
      }
    </>
  } //TODO: state isn't working yet

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
      {this.renderTestDataSection()}
      <hr/>

      {this.renderParseDocumentSection()}
      <hr/>

      {this.renderGetEventsSection()}
      <hr/>

      {this.renderUniqueTracksSection()}
    </div>
  }
}

export default App;

//TODO: indicate in UI when no dates were added because they already exist
