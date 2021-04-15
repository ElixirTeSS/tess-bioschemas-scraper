import config from 'config';
import fetch from 'node-fetch';

import { logger } from '../setup/logger';

class Content {
  protected user_email: string;
  protected user_token: string;
  protected _base: string;

  public id: number;

  constructor() {
    this.user_email = config.get('tess.api.email');
    this.user_token = config.get('tess.api.token');
    this._base = config.get('tess.api.base');
  }

  json(): string {
    let values = {};

    Object.entries(Object.getOwnPropertyDescriptors(this)).forEach(
      ([key, value]) => {
        if (key[0] !== '_') {
          values[key] = value?.value;
        }
      }
    );

    return JSON.stringify(values);
  }

  async create() {
    const options = {
      method: 'POST',
      body: this.json(),
    };

    const created = await this.request(options);
    this.id = created.id;

    return created?.id !== null;
  }

  async update() {}

  async exists(eventUrl) {
    let url = 'check_exists';

    const options = {
      method: 'POST',
      body: JSON.stringify({ url: eventUrl }),
    };

    const exists = await this.request(options, url);
    return exists?.id !== null;
  }

  async request(options: object = {}, endpoint?: string) {
    let url =
      endpoint !== undefined
        ? `${this._base}/${endpoint}.json`
        : `${this._base}.json`;

    let headers = {
      'Content-type': 'application/json',
    };

    let config = {
      ...options,
      headers: headers,
    };

    const response: Response = await fetch(url, config);
    const data: any = await response.json();

    if (response.ok) {
      return data;
    }

    logger.error(response);
    throw new Error(await response.json());
  }
}

export { Content };
