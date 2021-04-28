import { logger } from './setup/logger';

import config from 'config';
const providers: Array<{
  title: string;
  url: string;
  image_url: string;
  description: string;
  content_provider_type: string;
  node_name: string;
  keywords: Array<string>;
}> = config.get('providers');

import { ContentProvider } from './TessApi/ContentProvider';
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

  let validProviders = [];

  let checking = [];
  for (const provider of providers) {
    let validProvider = checkURL(provider.url);
    checking = [...checking, validProvider];
    if (validProvider) {
      validProviders = [...validProviders, provider];
    }
  }

  await Promise.all(checking);

  // const config = {
  //   sources: validURLs,
  //   httpProxyHandler: new ProxyHandlerStatic('http://localhost:8888?url='),
  // };

  let events: Array<Event> = [];
  for (const provider of validProviders) {
    ///create content provider in TeSS
    const cp = new ContentProvider(provider);
    await cp.createOrUpdate();

    for (const queryInfo of eventQueries()) {
      try {
        const result = await engine.query(queryInfo, {
          sources: [provider.url],
        });

        const bindings = await result.bindings();

        for (const data of bindings) {
          const eventUrl = data.get(`?url`)?.value;
          let event = events.find((event) => event.url == eventUrl);

          if (event) {
            event.set(provider.url, data);
          } else {
            event = new Event(provider.url, data, cp);
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
    await event.createOrUpdate();
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
