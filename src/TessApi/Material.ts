import { Content } from './Content';

// Represents a amterial in TeSS - this will be taken from TrainingMaterial in Bioschemas
class Material extends Content {
  name: string;
  abstract: string;
  keywords: string;
  description: string;
  dateCreated: string;
  license: string;
  learningResourceType: string;
  about: string;
  constructor(data: any) {
    super();
    this._base = `${this._base}/materials`;

    //data from rdf/json-ld
    this.name = data.get('?name')?.value;
    this.abstract = data.get('?abstract')?.value;
    this.url = data.get('?url')?.value;
    this.keywords = data.get('?keywords')?.value;
    this.description = data.get('?description')?.value;
    this.dateCreated = data.get('?dateCreated')?.value;
    this.license = data.get('?license')?.value;
    this.learningResourceType = data.get('?learningResourceType')?.value;
    this.about = data.get('?about')?.value;
  }
}

export { Material };
