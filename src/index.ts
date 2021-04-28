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
  let totalSaved = 0;
  let totalFound = 0;
  logger.info(`Starting Scraper`);

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
    let cp;
    try {
      logger.info(`New Content Provider: ${provider.title}`);
      cp = new ContentProvider(provider);
      await cp.createOrUpdate();
    } catch (error) {
      logger.error(`Content Provider Failed: ${provider.title}`);
      logger.error(error);
      return false;
    }

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
            logger.info(`More: ${event.url}`);
          } else {
            event = new Event(provider.url, data, cp);
            events = [...events, event];
            logger.info(`Found: ${event.url}`);
            totalFound++;
          }
        }
      } catch (error) {
        logger.error(`Error with Queries`);
        logger.info(`${error}`);
      }
    }
  }

  //Save all events
  logger.info(`Starting Save`);
  for (const event of events) {
    try {
      logger.info(`Saving: ${event.url}`);
      await event.createOrUpdate();
      totalSaved++;
    } catch (error) {
      logger.error(`Saving failed: ${event.url}`);
      logger.error(error);
    }
  }

  logger.info(`Total Found: ${totalFound}`);
  logger.info(`Total Saved: ${totalSaved}`);
  logger.info(`Finished`);

  process.exit();
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
