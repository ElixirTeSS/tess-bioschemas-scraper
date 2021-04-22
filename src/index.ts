import { logger } from './setup/logger';

import config from 'config';
const providers: Array<{ name: string; url: string }> = config.get('providers');

import { Event, queries as eventQueries } from './TessApi/Event';

import nodeFetch from 'node-fetch';
const engine = require('@comunica/actor-init-sparql').newEngine();
import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';

import { Proxy } from './Proxy';

logger.info(`Using config file: ${config.util.getConfigSources()[0].name}`);

// Start function
const start = async function () {
  let urls: Array<string> = providers.map(function (provider) {
    return provider.url;
  });

  let validURLs = [];

  let checking = [];
  for (const url of urls) {
    let validUrl = checkURL(url);
    checking = [...checking, validUrl];
    if (validUrl) {
      validURLs = [...validURLs, url];
    }
  }

  await Promise.all(checking);

  // const config = {
  //   sources: validURLs,
  //   httpProxyHandler: new ProxyHandlerStatic('http://localhost:8888?url='),
  // };

  let events: Array<Event> = [];
  for (const endpoint of validURLs) {
    for (const queryInfo of eventQueries()) {
      try {
        const result = await engine.query(queryInfo, {
          sources: [endpoint],
        });

        const bindings = await result.bindings();

        for (const data of bindings) {
          const eventUrl = data.get(`?url`)?.value;
          let event = events.find((event) => event.url == eventUrl);

          if (event) {
            event.set(endpoint, data);
          } else {
            event = new Event(endpoint, data);
            events = [...events, event];
          }

          logger.info(`Found Event Data: ${event.url}`);
          logger.info(events[0]);
        }
      } catch (ex) {
        logger.info(`${ex}`);
      }
    }
  }

  //Save all events
  for (const event of events) {
    event.createOrUpdate();
  }
};

async function checkURL(url) {
  try {
    await nodeFetch(url);
    return true;
  } catch (error) {
    logger.error(`Invalid URL ${url}`);
    return false;
  }
}

// Call start
start();

const proxy = new Proxy();
proxy.startProxy();

export {};
