import { IncomingMessage } from 'http';
import { Duplex } from 'stream';
import { HandlerResponse, Instance, ProxyConf, ProxyError } from '../models';
import * as cookie from 'cookie';
import { logger } from '../utils';
import { VisaInstanceService } from '../services';

export abstract class ProxyMiddleWare {

  get name(): string {
    return this._config.name;
  }

  constructor(protected _config: ProxyConf, protected _visaInstanceService: VisaInstanceService) {
  }

  isWebsocketHandler(): boolean {
    return this._config.ws === true;
  }

  handlesRequest(req: IncomingMessage): boolean {
    const regex = this._config.match
    const match = req.url.match(regex)
    
    return match != null;
  }

  handlesWebsocketRequest(req: IncomingMessage): boolean {
    return this._config.ws == true && this.handlesRequest(req);
  }

  /**
   * Initialise the proxy
   */
  abstract init(): Promise<void>;

  /**
   * Intercept an HTTP request and determine return the proxy URL
   * @param req the incoming request
   */
  async interceptRequest(req: IncomingMessage): Promise<HandlerResponse> {
    // Get token
    const accessToken = this.getAccessToken(req);

    const instance = await this.getAuthenticatedInstance(req, accessToken);

    // Get IP and port from request
    const target = this.getTarget(req, instance);

    // Rewrite path if needed
    this.rewriteRequestPath(req);

    // Handle any specific stuff
    await this.onInterceptRequest(req, instance, accessToken);

    return {instance, target};
  }

  /**
   * Intercept a Websocket upgrade request and determine the proxy URL
   * @param req the incoming request
   */
  async interceptWesocketRequest(req: IncomingMessage, socket: Duplex): Promise<HandlerResponse> {
    // Get token
    const accessToken = this.getAccessToken(req);

    const instance = await this.getAuthenticatedInstance(req, accessToken);
    
    // Get IP and port from request
    const target = this.getTarget(req, instance);

    // Rewrite path if needed
    this.rewriteRequestPath(req);

    // Handle any specific stuff
    await this.onInterceptWesocketRequest(req, socket, instance, accessToken);

    return {instance, target};
  }

  /**
   * Overloaded method
   * @param req 
   */
  abstract onInterceptRequest(req: IncomingMessage, instance: Instance, accessToken: string): Promise<void>;

  /**
   * Overloaded method
   * @param req 
   * @param socket 
   */
  abstract onInterceptWesocketRequest(req: IncomingMessage, socket: Duplex, instance: Instance, accessToken: string): Promise<void>;

  private getAccessToken(req: IncomingMessage): string {
    const accessToken = this.getAccessTokenFromHeaders(req) || this.getAccessTokenFromCookies(req);
    if (accessToken == null) {
      throw new ProxyError(401, 'No access token');
    }
    return accessToken;
  }

  private getAccessTokenFromCookies(req: IncomingMessage): string {
    if (!req.headers.cookie) {
      return null;
    }
    const cookies = cookie.parse(req.headers.cookie);

    const accessToken = cookies['access_token'];

    return accessToken;
  }

  private getAccessTokenFromHeaders(req: IncomingMessage): string {
    const authorizationHeader = this.getCaseInsensitiveHeader('authorization', req);
    if (authorizationHeader == null) {
      return null;
    }

    if (authorizationHeader.toLowerCase().startsWith('bearer ')) {
      return authorizationHeader.substring(7).trim();
    }

    return null;
  }

  private getCaseInsensitiveHeader(header: string, req: IncomingMessage): string {
    const lowerCaseHeader = header.toLowerCase();
    for (const requestHeader in req.headers) {
      if (requestHeader.toLowerCase() === lowerCaseHeader) {
        return req.headers[requestHeader] as string;
      }
    }
  }

  private getInstanceIdFromPath(path: string): Number {
    const regex = this._config.match
    const match = path.match(regex)
    if (match != null && match.length >= 1) {
      const instanceId = Number(match[1]);

      if (isNaN(instanceId)) {
        logger.error(`Handler '${this._config.name}' could not proxy request : Instance Id is not valid in request path ${path}`);
        throw new ProxyError(400, 'Instance Id not valid in the path');
      }
  
      return instanceId;
 
    } else {
      logger.error(`Handler '${this._config.name}' could not proxy request : Could not get instance Id from request path ${path}`);
      throw new ProxyError(400, 'Instance Id not present in the path');
    }
  }  
 
  private async getAuthorisedInstance(instanceId: Number, accessToken: string): Promise<Instance> {
    try {
      const instance = await this._visaInstanceService.getInstance(instanceId.valueOf(), accessToken);

      return instance;

    } catch (error: any) {
      logger.error(`Handler '${this._config.name}' could not get instance with Id ${instanceId}: ${error.message} (${error.statusCode})`);
      throw error;
    }
  }

  private async getAuthenticatedInstance(req: IncomingMessage, accessToken: string): Promise<Instance> {
    // Decode proxy path
    const path = req.url;
    const instanceId = this.getInstanceIdFromPath(path);

    // Convert path into instance and authorise with user
    const instance = await this.getAuthorisedInstance(instanceId, accessToken);

    return instance;
  }  

  private getTarget(req: IncomingMessage, instance: Instance): string {
    // Set remote server URL
    const serverURL = `http://${instance.ipAddress}:${this._config.remotePort}`;

    return serverURL;
  }  

  private rewriteRequestPath(req: IncomingMessage)  {
    if (this._config.pathRewrite) {
      const rules = Object.entries(this._config.pathRewrite);
      const rule = rules.find(([key]) => req.url.match(key));

      if (rule) {
        const [search, replace] = rule;
        const proxyUrl = req.url.replace(new RegExp(search), replace);
        req.url = proxyUrl;
      }
    }
  }  
}
