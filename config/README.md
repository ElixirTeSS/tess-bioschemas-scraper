## Content Providers
WARNING!! In its current configuration, the configuration contains both the username and secret token of the scraper.

Most of the files within the yml are self explanatory, however, there are 3 that have a special function
- sitemap_url: if given, the each of the urls listed in the sitemap will be scraped instead of the url.
- debug: if true, it prints the resulting scraped content into a local file.
- file: if given, it will load a local file instead of trying to scrape the url.

By default, development.yml will be employed, unless the environment variable is set to "production"
`export NODE_ENV=production`