const puppeteer = require('puppeteer');
const express = require('express');
import { logger } from './setup/logger';

class Proxy {
  constructor() {}

  async getPage(url) {
    logger.info(`Puppeteer get: ${url}`);

    try {
      const browser = await puppeteer.launch();
      const page = await browser.newPage();
      const response = await page.goto(url, { waitUntil: 'networkidle2' });
      let html = await page.content();
      const headers = response.headers();

      //use the inner text of the body to strip wrapper added by puppeteer
      if (headers['content-type'].indexOf('json') !== -1) {
        html = await page.evaluate(
          () => document.querySelector('body').innerText
        );
      }

      await browser.close();

      return { content: html, headers: headers };
    } catch (ex) {
      logger.info(`getPage: ${ex}`);
    }
  }

  startProxy() {
    const app = express();

    app.get('/', async (req, res) => {
      try {
        const url = req.query.url;
        const page = await this.getPage(url);

        //ensure that we have the correct headers require for comunica
        if (page.headers['content-type']) {
          res.setHeader('content-type', page.headers['content-type']);
        }
        if (page.headers['link']) {
          res.setHeader('link', page.headers['link']);
        }

        res.send(page.content);
      } catch (ex) {
        logger.info(`startProxy: ${ex}`);
      }
    });

    app.listen(8888, () => console.log('Proxy running on port: 8888'));
  }
}

export { Proxy };
