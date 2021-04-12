import { Content } from './Content';
class Event extends Content {
  name: string;
  description: string;
  url: string;
  startDate: string;
  endDate: string;

  constructor(data: any) {
    super();
    this._base = `${this._base}/events`;

    //data from rdf/json-ld
    this.name = data.get('?name')?.value;
    this.description = data.get('?description')?.value;
    this.url = data.get('?url')?.value;
    this.startDate = data.get('?startDate')?.value;
    this.endDate = data.get('?endDate')?.value;
  }
}

export { Event };
