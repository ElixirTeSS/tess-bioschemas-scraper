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

const testJson = require('../test/Course-test.json');

import { ContentProvider } from './TessApi/ContentProvider';
import { Event, eventQueries, courseQueries } from './TessApi/Event';

import nodeFetch from 'node-fetch';
import { Headers } from 'node-fetch';

const engine = require('@comunica/actor-init-sparql').newEngine();
import { ProxyHandlerStatic } from '@comunica/actor-http-proxy';

import { Proxy } from './Proxy';

const GetSitemapLinks = require("get-sitemap-links").default;
const WAE = require('web-auto-extractor').default
const jsonata = require("jsonata");

import { readFileSync, writeFileSync } from 'fs';

import { jsonExtractContent, extractCourses } from './utils';

logger.info(`Using config file: ${config.util.getConfigSources()[0].name}`);

// Start function
const start = async function () {
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

  // TODO: Chris defaulted to class Event, depending on the provider setting, the Material class should be used
  let events: Array<Event> = [];
  for (const provider of validProviders) {
    ///create content provider in TeSS
    let cp: ContentProvider;
    let cpEvents: Array<Event> = [];
    try {
      logger.info(`New Content Provider: ${provider.title}`);
      cp = new ContentProvider(provider);
      if (cp.valid()) {
        await cp.createOrUpdate();
      } else {
        logger.error(`Invalid Content Provider ${provider.title}, check it has all properties`);
        logger.error(`${provider.title} has been skipped`);
        continue;
      }
    } catch (error) {
      logger.error(`Content Provider Failed: ${provider.title}`);
      logger.error(`${provider.title} has been skipped`);
      logger.error(error);
      continue;
    }

    // New flexible approach
    // Get sitemap.xml
    const urlList = cp.sitemap_url ? await sitemap_getUrls(cp.sitemap_url) : [cp.url];
    for (const url of urlList) {

      let strictJson;
      let parsed;

      if (provider.file) {
        logger.info(`Processing local file ${provider.file}`);
        strictJson = true;
        try {
          parsed = JSON.parse(readFileSync(provider.file).toString());
        } catch (error) {
          logger.error(`Invalid local file ${provider.file}`);
        }
      } else {
        logger.info(`Processing: ${url}`);

        // Use headers to avoid content negotiation server-side
        const myHeaders = new Headers({
          'Accept': 'text/html',
          'Content-Type': 'text/html'
        });

        const response = await nodeFetch(url, { headers: myHeaders });
        const body = await response.text();
        let strictJson = response.headers.get("content-type") == "application/json"
        // if server returns json even after requesting html, the response will be parsed differently

        // Parse results
        const wae = WAE()
        parsed = strictJson ? JSON.parse(body) : wae.parse(body)
      }

      let contentArray = jsonExtractContent(parsed) || [];

      // Ensure the parsed content is an array
      contentArray = Symbol.iterator in Object(contentArray) ? contentArray : [contentArray];
      for (const contentObject of contentArray) {
        // In the case of courses, process each courseinstance within it
        if (jsonata('`@type`').evaluate(contentObject) == "Course") {
          const courseObjectArray = extractCourses(contentObject)
          for (const courseObject of courseObjectArray) {
            const event = new Event(provider.url, courseObject, cp);
            cpEvents = [...cpEvents, event];
            logger.info(`Found: ${event.url}`);
          }
        }
        else {
          const event = new Event(provider.url, contentObject, cp);
          cpEvents = [...cpEvents, event];
          logger.info(`Found: ${event.url}`);
        }
      };
    }
    logger.info(`Flexible crawler ${cp.title} found ${cpEvents.length} events`);
    events = [...cpEvents, ...events]
    if (provider.debug) writeFileSync(`./scrapedData_${cp.title}.json`, JSON.stringify(events));
  }


  //Save all events
  logger.info(`Starting Save`);
  let totalSaved = 0;
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


  logger.info(`Total Found: ${events.length}`);
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

/**
 * Given a url pointing to a sitemap, returns the list of urls inside it
 * @param url 
 * @returns array of url strings
 */
async function sitemap_getUrls(url: string) {
  try {
    return GetSitemapLinks(url);
  } catch (error) {
    logger.error(`Invalid URL ${url}`);
    return false;
  }
}

async function fetch_url(url: string) {
  try {
    nodeFetch(url)
      .then(res => {
        logger.info(`Response res from fetch_url ${url}:${res.text()}`);
      })
      .then(body => {
        logger.info(`Response body from fetch_url ${url}: ${body}`);
        return (body)
      });
  } catch (error) {
    logger.error(`Invalid URL ${url}`);
    return false;
  }
}

// Call start
start();

const proxy = new Proxy();
proxy.startProxy();

export { };
