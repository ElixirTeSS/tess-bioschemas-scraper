import { Content } from './Content';
import { ContentProvider } from './ContentProvider';

// Represents a material in TeSS - this will be taken from TrainingMaterial in Bioschemas
class Material extends Content {
  name: string;
  abstract: string;
  keywords: Array<string>;
  scientific_topic_uris: Array<string>;
  description: string;
  dateCreated: string;
  license: string;
  learningResourceType: string;
  about: string;

  content_provider_id: number;

  constructor(endpoint: string, data: any, cp: ContentProvider) {
    super();
    this._base = `${this._base}/events`;
    this.content_provider_id = cp.id;

    this.keywords = [];
    this.scientific_topic_uris = [];

    this.set(endpoint, data);
  }

  set(endpoint, data) {
    this.setValue('name', data.get(`?name`));
    this.setValue('abstract', data.get(`?abstract`));
    this.setValue('url', data.get(`?url`));
    this.setValue('description', data.get(`?description`));
    this.setValue('license', data.get(`?license`));
    this.setValue('learningResourceType', data.get(`?learningResourceType`));
    this.setValue('about', data.get(`?about`));

    if (data.get(`?keywords`) != null) {
      this.keywords = [...this.keywords, this.getValue(data.get(`?keywords`))];
    }

    if (data.get(`?topic`) != null) {
      this.scientific_topic_uris = [
        ...this.scientific_topic_uris,
        this.getValue(data.get(`?topic`)),
      ];
    }

    endpoint = this.trim(endpoint);
  }
}

function materialQueries() {
  const queryStart = `
  prefix schema:  <http://schema.org/>
  prefix rdfns: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

  select *
  where {
  ?course rdfns:type schema:TrainingMaterial .
  ?course schema:name ?name .
  ?course schema:url ?url .
  `;

  const queryEnd = `}`;

  let queries = [];

  //course
  //main course query
  queries.push(`
  ${queryStart}
  OPTIONAL { ?course schema:abstract ?abstract . } .
  OPTIONAL { ?course schema:description ?description . } .
  OPTIONAL { ?course schema:license ?license . } .
  OPTIONAL { ?course schema:learningResourceType ?learningResourceType . } .
  OPTIONAL { ?course schema:about ?about . } .
  ${queryEnd}
  `);

  //keywords
  queries.push(`${queryStart}
  OPTIONAL { ?course schema:keywords ?keywords . } .
  ${queryEnd}
  `);


  return queries;
}

export { Material };
