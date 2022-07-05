# TeSS Bioschemas Scraper

The TeSS Bioschemas Scraper is a web scraper that scrapes content providers for Bioschemas markup and saves it using the TeSS API.

The scraper makes use of the [Comunica Framework](https://comunica.github.io/comunica/), a framework for building semantic web applications.

## Prerequisites

The only prerequisite is [Node.js](https://nodejs.org/en/).

## Setup

### Install the dependencies

`npm install`

### Update Configuration

For development, you need to update the config/development.yml and for production, you need to update the config/production.yml.

This fille needs updating with the URL and API key for the TeSS installation.

## Run

Once you have install the dependencies, you can run the scraper with the following command:

`npm run start`

## Debugging

All logs are written to the `logs/` directory. Each day a new log file is created.

## testing
run `npm run test`