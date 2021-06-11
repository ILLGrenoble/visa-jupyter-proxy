import { APPLICATION_CONFIG } from '../application-config';
import * as nodePersist from 'node-persist'
import * as fs from 'fs';
import Bottleneck from 'bottleneck';

export class Store {

  private _localStorage: nodePersist.LocalStorage
  private _limiter: Bottleneck;

  constructor() {
    const dir = APPLICATION_CONFIG().storage.dir

    this._limiter = new Bottleneck({
      minTime: 1,
      maxConcurrent: 1
    });

    this._localStorage = nodePersist.create({
      dir: dir,
      stringify: JSON.stringify,
      parse: JSON.parse,
      encoding: 'utf8',
      logging: false,
    });

    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
  }

  async set(key: string, value: any): Promise<any> {
    return await this._limiter.schedule(() => this._localStorage.setItem(key, value));
  }

  async get(key: string): Promise<any> {
    return await this._limiter.schedule(() => this._localStorage.getItem(key));
  }

  async remove(key: string): Promise<any> {
    return await this._limiter.schedule(() => this._localStorage.removeItem(key));
  }


}