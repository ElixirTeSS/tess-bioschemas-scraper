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

export { Material };
