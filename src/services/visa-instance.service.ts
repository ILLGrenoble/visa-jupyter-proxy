import Axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { APPLICATION_CONFIG } from "../application-config";
import { Instance, InstanceNotebookSession, ProxyError } from "../models";
import { InstanceCacheService } from "./instance-cache.service";
import JwtDecode from 'jwt-decode';
import { logger } from "../utils";

export class VisaInstanceService {

  private _apiClient: AxiosInstance;
  private _instanceUrl: string;
  private _cacheService: InstanceCacheService;

  private get apiClient(): AxiosInstance {
    if (this._apiClient == null) {
      this._apiClient = Axios.create({
        baseURL: this._instanceUrl,
        responseType: 'json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this._apiClient.interceptors.response.use((response) => response, (error) => {
        if (error.response) {
          const message = error.response.data.message ? error.response.data.message : error.response.data ? error.response.data : error.message;
          return Promise.reject(new ProxyError(error.response.status, message));
  
        } else {
          return Promise.reject(new ProxyError(500, error.message));
        }
      })
    }

    return this._apiClient;
  }

  constructor() {
    this._instanceUrl = `http://${APPLICATION_CONFIG().api.host}:${APPLICATION_CONFIG().api.port}/api`;
    logger.info(`Using VISA api server at ${this._instanceUrl}`);
    this._cacheService = new InstanceCacheService();
  }

  async getInstance(instanceId: number, accessToken: string): Promise<Instance> {
    const decodedToken = JwtDecode(accessToken);
    const userId = decodedToken['employeeNumber'];

    // Get instance from the cache
    let instance = this._cacheService.getInstance(instanceId, userId);

    // If instance not in the cache then make a request to the api service
    if (instance == null) {
      const response = await this.apiClient.get(`jupyter/instances/${instanceId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
  
      instance = response.data.data as Instance;

      // Add the instance to the cache
      this._cacheService.addInstance(instance, userId);
    }

    return instance;
  }

  async onJupyterNotebookOpened(instanceNotebookSession: InstanceNotebookSession, accessToken: string): Promise<void> {
    const notebookSession = {
      kernelId: instanceNotebookSession.kernel,
      sessionId: instanceNotebookSession.sessionId
    };

    await this.apiClient.post(`jupyter/instances/${instanceNotebookSession.instanceId}/notebook/open`, notebookSession, this.authorizationHeader(accessToken));
  }

  async onJupyterNotebookClosed(instanceNotebookSession: InstanceNotebookSession): Promise<void> {
    const notebookSession = {
      kernelId: instanceNotebookSession.kernel,
      sessionId: instanceNotebookSession.sessionId
    };

    await this.apiClient.post(`jupyter/instances/${instanceNotebookSession.instanceId}/notebook/close`, notebookSession);
  }

  private authorizationHeader(accessToken: string): {headers: { Authorization: string} } {
    return {
      headers: { Authorization: `Bearer ${accessToken}` }
    }
  }
}