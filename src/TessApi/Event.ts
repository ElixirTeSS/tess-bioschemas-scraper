import { logger } from '../setup/logger';
import { Content } from './Content';
import { ContentProvider } from './ContentProvider';
const jsonata = require("jsonata");
const event_schema = require('../../schemas/Event.json');
const course_schema = require('../../schemas/Course.json');
// Represents an event in TeSS - this will be taken from Course/CourseInstance in Bioschemas
class Event extends Content {
  title: string;
  description: string;
  start: string;
  end: string;
  subtitle: string;
  capacity: number;

  contact: string;

  target_audience: Array<string>;
  keywords: Array<string>;
  scientific_topic_uris: Array<string>;
  sponsors: Array<{ name: string; email: string; url: string }>;
  host_institution: Array<{ name: string; email: string; url: string }>;
  event_types: Array<string>;
  eligibility: Array<string>;

  venue: string;
  city: string;
  county: string;
  country: string;
  postcode: string;
  latitude: number;
  longitude: number;

  content_provider_id: number;

  _eventTypes: Array<string> = [
    'workshops and courses',
    'meetings and conferences',
    'receptions and networking',
    'awards and prizegivings',
  ];

  _eligibility: Array<string> = [
    'first come first served',
    'registration of interest',
    'by invitation',
  ];

  constructor(endpoint: string, data: any, cp: ContentProvider, strictJsonld) {
    super();
    this._base = `${this._base}/events`;
    this.content_provider_id = cp.id;

    this.target_audience = [];
    this.keywords = [];
    this.scientific_topic_uris = [];
    this.sponsors = [];
    this.host_institution = [];
    this.event_types = [];

    this.set(endpoint, data, strictJsonld);
  }

  set(endpoint, data, strictJsonld) {
    if (strictJsonld) this.setStrict(endpoint, data);
    else this.setFlexible(endpoint, data);
  }

  setStrict(endpoint, data) {
    this.setValue('title', data.get(`?name`));
    this.setValue('url', data.get(`?url`));
    this.setValue('description', data.get(`?description`));
    this.setValue('start', data.get(`?startDate`));
    this.setValue('end', data.get(`?endDate`));
    this.setValue('subtitle', data.get(`?alternateName`));
    this.setNum('capacity', data.get(`?maximumAttendeeCapacity`));

    endpoint = this.trim(endpoint);

    if (data.get(`?contact`) != null) {
      const name = this.getValue(data.get(`?contactName`));
      const url =
        this.trim(data.get(`?contactUrl`)?.value) == endpoint
          ? ''
          : this.getValue(data.get(`?contactUrl`));
      const email = this.getValue(data.get(`?contactEmail`));

      this.contact = `${name} ${email} ${url}`;
    }

    if (data.get(`?audience`) != null) {
      this.target_audience = [
        ...this.target_audience,
        this.getValue(data.get(`?audience`)),
      ];
    }

    if (data.get(`?keywords`) != null) {
      this.keywords = [...this.keywords, this.getValue(data.get(`?keywords`))];
    }

    if (data.get(`?topic`) != null) {
      this.scientific_topic_uris = [
        ...this.scientific_topic_uris,
        this.getValue(data.get(`?topic`)),
      ];
    }

    if (data.get(`?sponsor`) != null) {
      this.sponsors = [
        ...this.sponsors,
        {
          name: this.getValue(data.get(`?sponsorName`)),
          email: this.getValue(data.get(`?sponsorEmail`)),
          url:
            this.trim(data.get(`?sponsorUrl`)?.value) == endpoint
              ? ''
              : this.getValue(data.get(`?sponsorUrl`)),
        },
      ];
    }

    if (data.get(`?host`) != null) {
      this.host_institution = [
        ...this.host_institution,
        {
          name: this.getValue(data.get(`?hostName`)),
          email: this.getValue(data.get(`?hostEmail`)),
          url:
            this.trim(data.get(`?hostUrl`)?.value) == endpoint
              ? ''
              : this.getValue(data.get(`?hostUrl`)),
        },
      ];
    }

    if (data.get(`?eventType`) != null) {
      const formatted = cvCheck(
        this.getValue(data.get(`?eventType`)),
        this._eventTypes
      );
      if (formatted != null) {
        this.event_types = [...this.event_types, formatted];
      }
    }

    if (data.get(`?eligibility`) != null) {
      const formatted = cvCheck(
        this.getValue(data.get(`?eligibility`)),
        this._eligibility
      );
      if (formatted != null) {
        this.eligibility = [...this.eligibility, formatted];
      }
    }

    if (data.get(`?location`) != null) {
      this.venue = `${this.getValue(data.get(`?placeName`))} ${this.getValue(
        data.get(`?streetAddress`)
      )}`;
      this.city = this.getValue(data.get(`?addressLocality`));
      this.county = this.getValue(data.get(`?addressRegion`));
      this.country = this.getValue(data.get(`?addressCountry`));
      this.postcode = this.getValue(data.get(`?postalCode`));
    }
  }

  setFlexible(endpoint, data) {
    let fields = null;
    getField(data, ['`@type`']);
    switch (getField(data, ['`@type`'])) {
      case "Event":
        fields = event_schema;
        break;
      case "Course":
        fields = course_schema;
        break;
      default:
        fields = event_schema;
        break;
    }

    this.title = getField(data, fields.title);
    this.url = getField(data, fields.url);
    this.description = getField(data, fields.description);
    this.start = getField(data, fields.start);
    this.end = getField(data, fields.end);
    this.subtitle = getField(data, fields.subtitle);
    this.setNum('capacity', getField(data, fields.capacity));
    endpoint = this.trim(endpoint);

    if (getField(data, fields.contact) != null) {
      const name = getField(data, fields.contact_name);
      const url =
        this.trim(getField(data, fields.contact_url)) == endpoint
          ? ''
          : getField(data, fields.contact_url);
      const email = getField(data, fields.contact_email);

      this.contact = `${name} ${email} ${url}`.trim();
    }

    if (getField(data, fields.target_audience) != null) {
      this.target_audience = [
        ...this.target_audience,
        getField(data, fields.target_audience),
      ];
      this.target_audience = this.target_audience.filter(n => n)
    }

    if (getField(data, fields.keywords) != null) {
      this.keywords = [...this.keywords, getField(data, fields.keywords)];
      this.keywords = this.keywords.filter(n => n)
    }

    if (getField(data, fields.scientific_topic_uris) != null) {
      this.scientific_topic_uris = [
        ...this.scientific_topic_uris,
        getField(data, fields.scientific_topic_uris),
      ];
      this.scientific_topic_uris = this.scientific_topic_uris.filter(n => n)
    }

    if (getField(data, fields.sponsor) != "") {
      this.sponsors = [
        ...this.sponsors,
        {
          name: getField(data, fields.sponsor_name),
          email: getField(data, fields.sponsor_email),
          url:
            this.trim(getField(data, fields.sponsor_url)) == endpoint
              ? ''
              : getField(data, fields.sponsor_url),
        },
      ];
      this.sponsors = this.sponsors.filter(n => n)
    }

    // There are too many "organization" types in the schema to use it as a query, we'll search for "host" names
    // const host_partial_match = findField(data, 'host');
    if (getField(data, fields.host_institution) != null) {
      this.host_institution = [
        ...this.host_institution,
        {
          name: getField(data, fields.host_institution_name),
          email: getField(data, fields.host_institution_email),
          url:
            this.trim(getField(data, fields.host_institution_url)) == endpoint
              ? ''
              : getField(data, fields.host_institution_url),
        },
      ];
      this.host_institution = this.host_institution.filter(n => n)
    }

    if (getField(data, fields.event_types) != null) {
      const formatted = cvCheck(
        getField(data, fields.event_types),
        this._eventTypes
      );
      if (formatted != null) {
        this.event_types = [...this.event_types, formatted];
      }
    }

    if (getField(data, fields.eligibility) != null) {
      const formatted = cvCheck(
        getField(data, fields.eligibility),
        this._eligibility
      );
      if (formatted != null) {
        this.eligibility = [...this.eligibility, formatted];
      }
    }

    // TODO: If we get rid o mode, nested components can be extracted beforehand
    // to simplify this code
    // https://schema.org/location
    // TODO: It currently relies on https://schema.org/PostalAddress, might want to add https://schema.org/Place
    if (getField(data, fields.location) != null) {
      this.venue = `${getField(data, fields.location_name)
        } ${getField(data, fields.location_streetAddress)
        }`;
      this.city = getField(data, fields.location_city);
      this.county = getField(data, fields.location_county);
      this.country = getField(data, fields.location_country);
      this.postcode = getField(data, fields.location_postcode);
    }
    if (getField(data, fields.geo) != null) {
      this.longitude = getField(data, fields.geo_longitude);
      this.latitude = getField(data, fields.geo_latitude);
    }
  }
}

/**
 * helper function to retrieve a given field name from a data structure
 * The fieldName is an array where the first matching field name will be retrieved
 * @param data 
 * @param fieldNameList
 */
function getField(data, fieldNameList: Array<String>) {
  logger.info(getField)

  logger.info(fieldNameList)
  if (!fieldNameList || fieldNameList === [""]) return ""
  for (const fieldName of fieldNameList) {
    let value = jsonata(fieldName).evaluate(data)
    // if it's a string, trim it
    if (value && value.replace === "function") return value.replace(/(\r\n|\n|\r)/gm, "").trim();
    if (value) return value;
  }
  return ""
}

/**
 * DEPRECATED: we won't be looking at partial matches
 * Returns the first occurrence of the node under root that matches the given substring
 * @param data
 * @param fieldSubName 
 * @returns string with the name of the matching node
 */
function findField(data, fieldSubName) {
  return jsonata(`$filter($keys(), function($v) {$contains($v,'${fieldSubName}')})[0]`).evaluate(data)
}

function cvCheck(value: string, vocab: Array<string>): string {
  const formatted = value.replaceAll(' ', '_');
  const found = vocab.indexOf(value);
  return found > -1 ? formatted : null;
}

function eventQueries() {
  const queryStart = `
  prefix schema:  <http://schema.org/>
  prefix rdfns: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

  select *
  where {
  ?event rdfns:type schema:Event .
  ?event schema:name ?name .
  ?event schema:url ?url .
  `;

  const queryEnd = `}`;

  let queries = [];

  //main query
  queries.push(`
  ${queryStart}
  OPTIONAL { ?event schema:description ?description . } .
  OPTIONAL { ?event schema:startDate ?startDate . } .
  OPTIONAL { ?event schema:endDate ?endDate . } .
  OPTIONAL { ?event schema:alternateName ?alternateName . } .
  OPTIONAL { ?event schema:eventType ?eventType . } .
  OPTIONAL { ?event schema:eligibility ?eligibility . } .
  OPTIONAL { ?event schema:maximumAttendeeCapacity ?maximumAttendeeCapacity . } .
  ${queryEnd}
  `);

  //contact
  queries.push(`${queryStart}
  ?event schema:contact ?contact .
  OPTIONAL { ?contact schema:name ?contactName . } .
  OPTIONAL { ?contact schema:email ?contactEmail . } .
  OPTIONAL { ?contact schema:url ?contactUrl . } .
  ${queryEnd}
  `);

  //audience
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:audience ?audience . } .
  ${queryEnd}
  `);

  queries.push(`${queryStart}
  ?event schema:audience ?audience .
  ?audience rdfns:type schema:audience .
  ?audience schema:audienceType ?audience
  ${queryEnd}
  `);

  //keywords
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:keywords ?keywords . } .
  ${queryEnd}
  `);

  //topics
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:topic ?topic . } .
  ${queryEnd}
  `);

  //sponsors
  queries.push(`${queryStart}
  ?event schema:sponsor ?sponsor .
  OPTIONAL { ?sponsor schema:name ?sponsorName . } .
  OPTIONAL { ?sponsor schema:email ?sponsorEmail . } .
  OPTIONAL { ?sponsor schema:url ?sponsorUrl . } .
  ${queryEnd}
  `);

  //host institution
  queries.push(`${queryStart}
  ?event schema:hostInstitution ?host .
  OPTIONAL { ?host schema:name ?hostName . } .
  OPTIONAL { ?host schema:email ?hostEmail . } .
  OPTIONAL { ?host schema:url ?hostUrl . } .
  ${queryEnd}
  `);

  //location
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:location ?location . } .
  OPTIONAL { ?location schema:name ?placeName . } .
  OPTIONAL { ?location schema:address ?address . } .
  OPTIONAL { ?address schema:streetAddress ?streetAddress . } .
  OPTIONAL { ?address schema:addressCountry ?addressCountry . } .
  OPTIONAL { ?address schema:addressLocality ?addressLocality . } .
  OPTIONAL { ?address schema:addressRegion ?addressRegion . } .
  OPTIONAL { ?address schema:postalCode ?postalCode . } .
  ${queryEnd}
  `);

  return queries;
}

function courseQueries() {
  const queryStart = `
  prefix schema:  <http://schema.org/>
  prefix rdfns: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

  select *
  where {
  ?course rdfns:type schema:Course .
  ?course schema:name ?name .
  ?course schema:url ?url .
  `;

  const queryEnd = `}`;

  let queries = [];

  //course
  //main course query
  queries.push(`
  ${queryStart}
  OPTIONAL { ?course schema:description ?description . } .
  OPTIONAL { ?course schema:alternateName ?alternateName . } .
  ${queryEnd}
  `);

  //audience
  queries.push(`${queryStart}
  OPTIONAL { ?course schema:audience ?audience . } .
  ${queryEnd}
  `);

  queries.push(`${queryStart}
  ?course schema:audience ?audience .
  ?audience rdfns:type schema:audience .
  ?audience schema:audienceType ?audience
  ${queryEnd}
  `);

  //keywords
  queries.push(`${queryStart}
  OPTIONAL { ?course schema:keywords ?keywords . } .
  ${queryEnd}
  `);

  //topics
  queries.push(`${queryStart}
  OPTIONAL { ?course schema:about ?topic . } .
  ${queryEnd}
  `);

  //host institution/provider
  queries.push(`${queryStart}
  ?course schema:provider ?host .
  OPTIONAL { ?host schema:name ?hostName . } .
  OPTIONAL { ?host schema:email ?hostEmail . } .
  OPTIONAL { ?host schema:url ?hostUrl . } .
  ${queryEnd}
  `);

  //courseInstance

  //Main courseInstance query
  queries.push(`${queryStart}
  ?course schema:hasCourseInstance ?hasCourseInstance .
  OPTIONAL { ?hasCourseInstance schema:startDate ?startDate . } .
  OPTIONAL { ?hasCourseInstance schema:endDate ?endDate . } .
  OPTIONAL { ?hasCourseInstance schema:maximumAttendeeCapacity ?maximumAttendeeCapacity . } .
  ${queryEnd}
  `);

  //contact/organizer
  queries.push(`${queryStart}
  ?course schema:hasCourseInstance ?hasCourseInstance .
  ?hasCourseInstance schema:organizer ?contact .
  OPTIONAL { ?contact schema:name ?contactName . } .
  OPTIONAL { ?contact schema:email ?contactEmail . } .
  OPTIONAL { ?contact schema:url ?contactUrl . } .
  ${queryEnd}
  `);

  //sponsors/funder
  queries.push(`${queryStart}
  ?course schema:hasCourseInstance ?hasCourseInstance .
  ?hasCourseInstance schema:funder ?sponsor .
  OPTIONAL { ?sponsor schema:name ?sponsorName . } .
  OPTIONAL { ?sponsor schema:email ?sponsorEmail . } .
  OPTIONAL { ?sponsor schema:url ?sponsorUrl . } .
  ${queryEnd}
  `);

  //location
  queries.push(`${queryStart}
  ?course schema:hasCourseInstance ?hasCourseInstance .
  OPTIONAL { ?hasCourseInstance schema:location ?location . } .
  OPTIONAL { ?location schema:name ?placeName . } .
  OPTIONAL { ?location schema:address ?address . } .
  OPTIONAL { ?address schema:streetAddress ?streetAddress . } .
  OPTIONAL { ?address schema:addressCountry ?addressCountry . } .
  OPTIONAL { ?address schema:addressLocality ?addressLocality . } .
  OPTIONAL { ?address schema:addressRegion ?addressRegion . } .
  OPTIONAL { ?address schema:postalCode ?postalCode . } .
  ${queryEnd}
  `);

  return queries;
}

export { Event, eventQueries, courseQueries };
