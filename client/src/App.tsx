import React from 'react';
import './App.css';
import {observer} from "mobx-react";
import {makeObservable, observable, runInAction} from "mobx";

export class AppMachine
{
  @observable testData: any = null;

  constructor()
  {
    makeObservable(this);
  }

  public async postRequest(url: string, data: any): Promise<any>
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
    const result: boolean = await this.machine.addEvent("2021-01-08","Seekonk Speedway");
    runInAction(() => this.machine.testData = result);
  }

  componentDidMount()
  {
    this.addEvent();
  }

  render()
  {
    return <div className="App">
      The value returned from the server is:
      {this.machine.testData}
    </div>
  }
}

export default App;
