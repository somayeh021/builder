import appState from '@builder.io/app-context';
import { Resource } from '@builder.io/commerce-plugin-tools';

const basicCache = new Map();

const transformProduct = (resource: any) => ({
  ...resource,
  id: resource.id as any,
  title: resource.name || 'untitled',
  handle: resource.id,
  image: {
    src:
      resource.imageGroups?.[0].images?.[0].link ||
      'https://unpkg.com/css.gg@2.0.0/icons/svg/toolbox.svg',
  },
});

const transformHit = (hit: any) => ({
  id: hit.productId as any,
  title: hit.productName || 'untitled',
  handle: hit.productId,
  image: {
    src: hit.image?.link || 'https://unpkg.com/css.gg@2.0.0/icons/svg/toolbox.svg',
  },
});

const transformCategory = (cat: any) => ({
  id: cat.id,
  title: cat.name,
  handle: cat.id,
  image: {
    src: cat.image || 'https://unpkg.com/css.gg@2.0.0/icons/svg/box.svg',
  },
});

export class Api {
  getBaseUrl(path: string, search = {}) {
    const params = new URLSearchParams({
      ...search,
      pluginId: this.pluginId,
      apiKey: this.apiKey,
    });
    const root = 'https://qa.builder.io'; // todo when app is released to prodappState.config.apiRoot();
    const baseUrl = new URL(`${root}/api/v1/sfcc-commerce/${path}`);
    baseUrl.search = params.toString();
    return baseUrl.toString();
  }

  constructor(private apiKey: string, private pluginId: string) {}

  request(path: string, config?: RequestInit, search = {}) {
    return fetch(`${this.getBaseUrl(path, search)}`, {
      ...config,
      headers: {
        'Content-Type': 'application/json',
      },
    }).then(res => res.json());
  }

  getProduct(id: string): Promise<any> {
    if (basicCache.get(id)) {
      return Promise.resolve(basicCache.get(id));
    }
    return this.request(`products/${id}`).then(product => {
      const resource = transformProduct(product);
      basicCache.set(resource.id, resource);
      return resource;
    });
  }

  search(search: string): Promise<Resource[]> {
    return this.request('products-search', { method: 'GET' }, { q: search }).then(search => {
      const resources = search.hits?.map(transformHit) || [];
      resources.forEach((r: Resource) => basicCache.set(r.id, r));
      return resources;
    });
  }

  getCategory(id: string): Promise<Resource> {
    if (basicCache.get(id)) {
      return Promise.resolve(basicCache.get(id));
    }
    return this.request(`categories/${id}`).then(cat => {
      const resource = transformProduct(cat);
      basicCache.set(resource.id, resource);
      return resource;
    });
  }

  searchCategories(search: string): Promise<Resource[]> {
    return this.request('categories-search', { method: 'GET' }, { q: search }).then(categories => {
      const resources = categories?.map(transformCategory) || [];
      resources.forEach((r: Resource) => basicCache.set(r.id, r));
      return resources;
    });
  }
}