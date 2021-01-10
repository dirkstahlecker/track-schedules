import React from 'react';
import './App.css';
import {observer} from "mobx-react";
import {makeObservable, observable, runInAction, action} from "mobx";

export class AppMachine
{
  @observable testData: any = null;
  @observable parseDocUrl: string | null = null;
  @observable parseDocTrackName: string | null = null;
  @observable eventDate: string | null = null;

  @observable eventsForDate: any = null;

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

  public async addEvent(date: string, trackname: string): Promise<boolean>
  {
    return this.postRequest(
      "/api/events/add", 
      {date: date, trackname: trackname});
  }

  public async getEventForDate(date: string): Promise<any>
  {
    return this.getRequest(`/api/events/${date}`)
  }

  public async parseDocument(): Promise<void>
  {
    return this.postRequest(
      "/api/events/parseDocument", 
      {url: this.parseDocUrl, trackname: this.parseDocTrackName});
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
    const result: boolean = await this.machine.addEvent("2021-01-08", "Seekonk Speedway");
    runInAction(() => this.machine.testData = result);
  }

  private async submitUrl(): Promise<void>
  {
    const result = await this.machine.parseDocument();
  }

  private async submitGetEventsForDate(): Promise<void>
  {
    const result = await this.machine.getEventForDate(this.machine.eventDate!!);
    runInAction(() => this.machine.eventsForDate = result.rows);
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

  componentDidMount()
  {
    // this.addEvent();
  }

  private renderListOfTracks(rows: Object[]): JSX.Element
  {
    return <div>
      {
        rows.map((row: any) => {
          return <span>{row.trackname}</span>;
        })
      }
    </div>
  }

  render()
  {
    return <div className="App">
      The value returned from the server is:
      {this.machine.testData}
      <br/>
      <hr/>
      <br/>
      Parse Document: <label htmlFor="parseDocumentInput">URL:</label>
      <input type="text" name="parseDocumentInput" onChange={this.onParseDocumentUrlChange}/>
      <label htmlFor="parseDocumentTrackName">Track Name:</label>
      <input type="text" name="parseDocumentTrackName" onChange={this.onParseDocumentTrackNameChange}/>
      <button onClick={() => this.submitUrl()}>Submit</button>
      <hr/>
      Get events for date:<br/>
      <label htmlFor="getEventsForDateInput">Date: </label>
      <input type="text" name="getEventsForDateInput" onChange={this.onGetEventForDateDateChange}/>
      <button onClick={() => this.submitGetEventsForDate()}>Submit</button>
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
        this.renderListOfTracks(this.machine.eventsForDate)
      }
    </div>
  }
}

export default App;
