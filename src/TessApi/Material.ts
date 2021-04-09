import { Content } from './Content';

class Material extends Content {
  name: any;
  abstract: any;
  url: any;
  keywords: any;
  description: any;
  dateCreated: any;
  license: any;
  learningResourceType: any;
  about: any;
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
