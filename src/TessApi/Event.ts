import { Content } from './Content';
class Event extends Content {
  title: string;
  url: string;
  description: string;
  start: string;
  end: string;
  address: string;
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

  constructor(data: any) {
    super();
    this._base = `${this._base}/events`;

    this.organizer = [];
    this.target_audience = [];
    this.keywords = [];
    this.scientific_topics = [];
    this.sponsors = [];
    this.host_institution = [];

    this.set(data);
  }

  set(data) {
    this.title = data.get(`?name`)?.value ?? this.title;
    this.url = data.get(`?url`)?.value ?? this.url;
    this.description = data.get(`?description`)?.value ?? this.description;
    this.start = data.get(`?startDate`)?.value ?? this.start;
    this.end = data.get(`?endDate`)?.value ?? this.end;
    this.address = data.get(`?location`)?.value ?? this.address;
    this.subtitle = data.get(`?alternativeNme`)?.value ?? this.subtitle;
    this.event_type = data.get(`?eventType`)?.value ?? this.event_type;
    this.eligibility = data.get(`?eligibility`)?.value ?? this.eligibility;
    this.capacity =
      data.get(`?maximumAttendeeCapacity`)?.value ?? this.capacity;

    if (data.get(`?contactName`) != null) {
      this.organizer = [
        ...this.organizer,
        {
          name: data.get(`?contactName`)?.value,
          email: data.get(`?contactEmail`)?.value,
          url: data.get(`?contactUrl`)?.value,
        },
      ];
    }

    if (data.get(`?audience`) != null) {
      this.target_audience = [
        ...this.target_audience,
        data.get(`?audience`)?.value,
      ];
    }

    if (data.get(`?keywords`) != null) {
      this.keywords = [...this.keywords, data.get(`?keywords`)?.value];
    }

    if (data.get(`?topic`) != null) {
      this.scientific_topics = [
        ...this.scientific_topics,
        data.get(`?topic`)?.value,
      ];
    }

    if (data.get(`?sponsorName`) != null) {
      this.sponsors = [
        ...this.sponsors,
        {
          name: data.get(`?sponsorName`)?.value,
          email: data.get(`?sponsorEmail`)?.value,
          url: data.get(`?sponsorUrl`)?.value,
        },
      ];
    }

    if (data.get(`?hostName`) != null) {
      this.host_institution = [
        ...this.host_institution,
        {
          name: data.get(`?hostName`)?.value,
          email: data.get(`?hostEmail`)?.value,
          url: data.get(`?hostUrl`)?.value,
        },
      ];
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

  // test query
  // queries.push(`
  // SELECT * WHERE {?s ?p ?o}
  // `);

  //main query
  queries.push(`
  ${queryStart}
  OPTIONAL { ?event schema:description ?description . } .
  OPTIONAL { ?event schema:startDate ?startDate . } .
  OPTIONAL { ?event schema:endDate ?endDate . } .
  OPTIONAL { ?event schema:location ?location . } .
  OPTIONAL { ?event schema:alternateName ?alternateName . } .
  OPTIONAL { ?event schema:eventType ?eventType . } .
  OPTIONAL { ?event schema:eligibility ?eligibility . } .
  OPTIONAL { ?event schema:maximumAttendeeCapacity ?maximumAttendeeCapacity . } .
  ${queryEnd}
  `);

  //contact
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:contact ?contact . } .
  OPTIONAL { ?contact schema:name ?contactName . } .
  OPTIONAL { ?contact schema:email ?contactEmail . } .
  OPTIONAL { ?contact schema:url ?contactUrl . } .
  ${queryEnd}
  `);

  //audience
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:audience schema:Event . } .
  OPTIONAL { ?event schema:audience ?audience . } .
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
  OPTIONAL { ?event schema:sponsor ?sponsor . } .
  OPTIONAL { ?sponsor schema:name ?sponsorName . } .
  OPTIONAL { ?sponsor schema:email ?sponsorEmail . } .
  OPTIONAL { ?sponsor schema:email ?sponsorUrl . } .
  ${queryEnd}
  `);

  //host institution
  queries.push(`${queryStart}
  OPTIONAL { ?event schema:hostInstitution ?host . } .
  OPTIONAL { ?host schema:name ?hostName . } .
  OPTIONAL { ?host schema:email ?hostEmail . } .
  OPTIONAL { ?host schema:url ?hostUrl . } .
  ${queryEnd}
  `);

  return queries;
}

export { Event, queries };
