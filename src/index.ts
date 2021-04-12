import { logger } from './setup/logger';

import config from 'config';
const providers: Array<{ name: string; url: string }> = config.get('providers');
const queries: Array<{ Name: string; Query: string }> = config.get('queries');

import { Event } from './TessApi/Event';
import { Material } from './TessApi/Material';

import nodeFetch from 'node-fetch';
const engine = require('@comunica/actor-init-sparql').newEngine();

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

  const config = {
    sources: validURLs,
  };

  let totalQueries = queries.length;
  for (const queryInfo of queries) {
    try {
      const { bindingsStream: bs } = await engine.query(
        queryInfo.Query,
        config
      );

      bs.on('data', function (data) {
        switch (queryInfo.Name) {
          case 'Event':
            let event = new Event(data);
            logger.info(`Found Event: ${event.url}`);
            break;
          case 'TrainingMaterial':
            let material = new Material(data);
            logger.info(`Found Training Material: ${material.url}`);
            break;
          default:
            logger.error(`Invalid Query`);
            throw Error('Invalid Query');
        }
      });

      //Ensure node exits when we have finished reading all the endpoints
      bs.on('end', function (data) {
        totalQueries--;
        if (totalQueries == 0) {
          process.exit(0); // none error exit
        }
      });

      bs.on('error', function (error) {
        logger.info(`${error}`);
      });
    } catch (ex) {
      logger.info(`${ex}`);
    }
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

export {};
