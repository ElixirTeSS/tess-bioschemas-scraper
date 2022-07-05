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

/**
 * Given a json containing schema objects returns an array of
 * elements (events, materials, or any other approved content)
 * WARNING! When modifying the query, consider possible combinations of nested elements
 * We want to check recursively, to process all json structure types (wae extraction nests
 * results into categories already). However, we want to avoid extracting redundant elements.
 * E.g. CoursesInstances within Courses, as well as on their own
 * Current logic extracts:
 * 1. Any Event and Course
 * 2. Removes CourseInstances nested within a Course
 * 3. Looks for CourseInstances
 * Any example query can be tested in https://try.jsonata.org/ using the test files and given example queries
 * @param input json object containing schema objects
 */
function jsonExtractContent(input) {
  // Example query to extract all event and course objects
  // **[`@type` in ["Event","Course"]];
  // $[] looks into the root attributes, while **[] checks recursively all nested
  // Example where only root elements are checked
  // $[`@type` in ["Event","Course","CourseInstance"]]
  // Finishing the expression with "[]" ensures it returns an array, even if there is a single result
  // Extract courses

  // WHAT about replacing the type field for the elements within Course?

  /** TODO: Find a way to consistently extract CourseInstances whose parent is not Course,
   * so mixed inputs can be handled. Alternatively, find a way to delete already extracted elements from input,
   * so the same content is not retrieved twice.
   * At the moment, we extract parent structures, and only look for possible nested ones if results comes empty
   */
  const courseArray = jsonata('**[`@type` in ["Event","Course"]][]').evaluate(input) || [];
  // Filter all CourseInstances from the already extracted courses, by replacing hasCourseInstance
  const newInput = jsonata('$ ~> |$[`@type`="Course"]|{"hasCourseInstance":"none"}|').evaluate(input);
  // extract additional elements
  return courseArray.concat(jsonata('**[`@type` in ["CourseInstance"]][]').evaluate(newInput) || []);
}

/**
 * Processes courses and extracts courseinstances, keeping the course information.
 * This way each courseInstance also contains all its parent's (course) information
 * WARNING: If a course doesn't contain any courseinstance child, an empty array is returned
 * effectively ignoring the course as a whole.
 * @param input course type object
 * @returns array of course objects, including a single course instance object
 */
function extractCourses(input) {
  // Given a single course object, create new course objects for each of the contained courseInstances
  // Adding "[]" at the end of the jsonata query ensures the result is an array
  const expression = jsonata('**[`@type` in ["CourseInstance"]][]');

  const instanceCount = expression.evaluate(input).length;
  let courseWithInstanceArray = [];
  for (const index of [...Array(instanceCount).keys()]) {
    // Keeps all the root attributes, with an additional single courseInstance
    // https://docs.jsonata.org/other-operators transform operator ~>
    // https://try.jsonata.org/Y0Qes2qkS
    const expression = jsonata(`$ ~> |$|{'hasCourseInstance': hasCourseInstance[${index}]}|`);
    courseWithInstanceArray = [...courseWithInstanceArray, expression.evaluate(input)];
  }
  return courseWithInstanceArray;
}

// Call start
start();

const proxy = new Proxy();
proxy.startProxy();

export { };
