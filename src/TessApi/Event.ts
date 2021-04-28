import { Content } from './Content';
import { ContentProvider } from './ContentProvider';
class Event extends Content {
  title: string;
  description: string;
  start: string;
  end: string;
  subtitle: string;
  event_type: string;
  eligibility: string;
  capacity: string;

  organizer: Array<{ name: string; email: string; url: string }>;
  target_audience: Array<string>;
  keywords: Array<string>;
  scientific_topics: Array<string>;
  sponsors: Array<{ name: string; email: string; url: string }>;
  host_institution: Array<{ name: string; email: string; url: string }>;

  venue: string;
  city: string;
  county: string;
  country: string;
  postcode: string;
  latitude: number;
  longitude: number;

  content_provider_id: number;

  constructor(endpoint: string, data: any, cp: ContentProvider) {
    super();
    this._base = `${this._base}/events`;
    this.content_provider_id = cp.id;

    this.organizer = [];
    this.target_audience = [];
    this.keywords = [];
    this.scientific_topics = [];
    this.sponsors = [];
    this.host_institution = [];

    this.set(endpoint, data);
  }

  set(endpoint, data) {
    this.setValue('title', data.get(`?name`));
    this.setValue('url', data.get(`?url`));
    this.setValue('description', data.get(`?description`));
    this.setValue('start', data.get(`?startDate`));
    this.setValue('end', data.get(`?endDate`));
    this.setValue('subtitle', data.get(`?alternateName`));
    this.setValue('event_type', data.get(`?eventType`));
    this.setValue('eligibility', data.get(`?eligibility`));
    this.setValue('capacity', data.get(`?maximumAttendeeCapacity`));

    endpoint = this.trim(endpoint);

    if (data.get(`?contact`) != null) {
      this.organizer = [
        ...this.organizer,
        {
          name: this.getValue(data.get(`?contactName`)),
          email: this.getValue(data.get(`?contactEmail`)),
          url:
            this.trim(data.get(`?contactUrl`)?.value) == endpoint
              ? ''
              : this.getValue(data.get(`?contactUrl`)),
        },
      ];
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
      this.scientific_topics = [
        ...this.scientific_topics,
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
}

function queries() {
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

export { Event, queries };
