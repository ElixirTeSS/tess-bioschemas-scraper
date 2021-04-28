import { Content } from './Content';

class ContentProvider extends Content {
  title: string;
  image_url: string;
  description: string;
  content_provider_type: any;
  node_id: number;
  node_name: string;
  keywords: Array<string>;
  content_provider: any;

  ///TODO: change type
  constructor(provider: any) {
    super();
    this._base = `${this._base}/content_providers`;

    this.title = provider.title;
    this.url = provider.url;
    this.image_url = provider.image_url;
    this.description = provider.description;
    this.content_provider_type = provider.content_provider_type;
    this.node_id = provider.node_id;
    this.node_name = provider.node_name;
    this.keywords = provider.keywords;
  }
}

export { ContentProvider };
