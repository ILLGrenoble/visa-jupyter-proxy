import { APPLICATION_CONFIG } from "../application-config";
import { Instance } from "../models";

class InstanceCacheEntry {
  userId: number;
  instanceId: number;
  instance: Instance;
  expires: Date;

  constructor(data?: Partial<InstanceCacheEntry>) {
    Object.assign(this, data);
  }
}

export class InstanceCacheService {

  private _refreshTimeS: number;
  private _userInstanceCache: Map<number, Map<number, InstanceCacheEntry>> = new Map();

  constructor() {
    this._refreshTimeS = APPLICATION_CONFIG().cache.refreshTimeS;
  }

  getInstance(instanceId: number, userId: number): Instance {
    const instanceCache = this._userInstanceCache.get(userId);
    if (instanceCache) {
      const instanceCacheEntry = instanceCache.get(instanceId);

      if (instanceCacheEntry) {
        if (instanceCacheEntry.expires.getTime() > new Date().getTime()) {
          return instanceCacheEntry.instance;
        
        } else {
          // Remove the entry from the instance cache
          instanceCache.delete(instanceId);
          
          // Remove the user from the global cache if no more instances associated to them
          if (instanceCache.size === 0) {
            this._userInstanceCache.delete(userId)
          } 
        }
      }
    }

    return null;
  }

  addInstance(instance: Instance, userId: number): void {
    let instanceCache = this._userInstanceCache.get(userId);
    if (!instanceCache) {
      instanceCache = new Map();
      this._userInstanceCache.set(userId, instanceCache);
    }

    const entry = new InstanceCacheEntry({
      userId: userId,
      instanceId: instance.id,
      instance: instance,
      expires: new Date(new Date().getTime() + (this._refreshTimeS * 1000))
    });

    instanceCache.set(instance.id, entry);
  }

}