const config = require('config');
const fetch = require('node-fetch');

const logger = require('../setup/logger');

class Content {
  protected _email: string;
  protected _token: string;
  protected _base: string;

  constructor() {
    this._email = config.get('tess.api.email');
    this._token = config.tess.api.token;
    this._base = config.tess.api.base;
  }

  json(): string {
    let values: object = {};

    Object.entries(Object.getOwnPropertyDescriptors(this)).forEach(
      ([key, value]) => {
        if (key[0] !== '_') {
          values[key] = value;
        }
      }
    );

    return values.toString();
  }

  async exists(eventUrl) {
    let url = 'check_exists.json';

    const options = {
      method: 'POST',
      body: JSON.stringify({ url: eventUrl }),
    };

    const exists = await this.request(url, options);
    return exists?.id !== null;
  }

  async request(endpoint = '', options = {}) {
    let url = `${this._base}/${endpoint}`;

    let headers = {
      user_email: this._email,
      user_token: this._token,
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
