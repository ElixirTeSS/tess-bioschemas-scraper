import config from 'config';
import fetch from 'node-fetch';

import { logger } from '../setup/logger';

class Content {
  protected user_email: string;
  protected user_token: string;
  protected _base: string;

  id: number;
  url: string;

  last_scraped: string;
  scraper_record: Boolean;

  constructor() {
    this.user_email = config.get('tess.api.email');
    this.user_token = config.get('tess.api.token');
    this._base = config.get('tess.api.base');
    this.last_scraped = new Date().toISOString();
    this.scraper_record = true;
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

  getValue(data) {
    if (data == null) {
      return '';
    } else return data.value;
  }

  setValue(field, data) {
    if (data != null) {
      this[field] = this.trim(data.value);
    }
  }

  setNum(field, data) {
    if (data != null) {
      this[field] = parseInt(data);
    }
  }

  trim(value) {
    return value.replace(/\/+$/, '');
  }

  async createOrUpdate() {
    if (await this.exists()) {
      await this.update();
    } else {
      await this.create();
    }
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

  async update() {
    const url = this.id.toString();

    const options = {
      method: 'PUT',
      body: this.json(),
    };

    const created = await this.request(options, url);

    return created?.id !== null;
  }

  async exists() {
    let url = 'check_exists';

    const options = {
      method: 'POST',
      body: JSON.stringify({ url: this.url }),
    };

    const exists = await this.request(options, url);
    this.id = exists?.id;
    return exists?.id != null;
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

    if (response.ok) {
      const data: any = await response.json();
      return data;
    }

    logger.error(response);
    logger.error(await response.text());
    throw new Error(await response.json());
  }
}

export { Content };
