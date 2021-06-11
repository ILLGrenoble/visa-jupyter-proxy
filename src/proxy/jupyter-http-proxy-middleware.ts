import { IncomingMessage } from 'http';
import { APPLICATION_CONFIG } from '../application-config';
import { logger } from '../utils';
import { Instance, InstanceNotebookSession, ProxyError } from '../models';
import { ProxyMiddleWare } from './proxy-middleware';
import { VisaInstanceService, NotebookSessionStorageService } from '../services';
import * as cookie from 'cookie';
import { Socket } from 'net';

export class JupyterHttpProxyMiddleware implements ProxyMiddleWare{

  private _jupyterPort: number;
  private _notebookStorageInitialised = false;

  constructor(private _visaInstanceService: VisaInstanceService, private _notebookSessionStorage: NotebookSessionStorageService) {
    this._jupyterPort = APPLICATION_CONFIG().jupyter.port;
  }

  public async initialiseNotebookSessionStorage(): Promise<void> {
    if (!this._notebookStorageInitialised) {
      // Clear any previously open notebook sessions
      const zombieInstanceNotebookSessions = await this._notebookSessionStorage.eraseInstanceNotebookSessionInStorage();
      for (const instanceNotebookSession of zombieInstanceNotebookSessions) {
        logger.debug(`Erasing zombie Jupyter notebook session for kernel ${instanceNotebookSession.kernel} with sessionId ${instanceNotebookSession.sessionId}`);
        await this._visaInstanceService.onJupyterNotebookClosed(instanceNotebookSession);
      }

      this._notebookStorageInitialised = true;
    }
  }
  
  async interceptRequest(req: IncomingMessage): Promise<string> {
    // Get access token from the request
    const accessToken = this.getAccessToken(req);

    // Get IP address from request
    const serverURL = await this.getAuthenticatedServerURL(req, accessToken);

    return serverURL;
  }

  async interceptWesocketRequest(req: IncomingMessage, socket: Socket): Promise<string> {
    // Get access token from the request
    const accessToken = this.getAccessToken(req);

    const instanceId = this.getInstanceIdFromPath(req.url);
    logger.debug(`got connection to socket for instance ${instanceId}`);

    const instanceNotebookSession = this.getInstanceNotebookSessionFromRequest(req.url);
    if (instanceNotebookSession != null) {

      // Notify api server of jupyter session start
      await this._visaInstanceService.onJupyterNotebookOpened(instanceNotebookSession, accessToken);
  
      // Add notebook session to persistence
      await this._notebookSessionStorage.addInstanceNotebookSessionToStorage(instanceNotebookSession);

      socket.on('close', async () => {
        logger.debug(`Socket closed for instance ${instanceId}`);
  
        // Notify api server of jupyter session end
        await this._visaInstanceService.onJupyterNotebookClosed(instanceNotebookSession);
  
        // Remove notebook session from persistence
        await this._notebookSessionStorage.removeInstanceNotebookSessionFromStorage(instanceNotebookSession);
      });
    }

    const serverURL = await this.getAuthenticatedServerURL(req, accessToken);

    return serverURL;
  }


  private async getAuthenticatedServerURL(req: IncomingMessage, accessToken: string): Promise<string> {
    // Decode proxy path
    const path = req.url;
    const instanceId = this.getInstanceIdFromPath(path);

    // Convert path into instance and authorise with user
    const instance = await this.getAuthorisedInstance(instanceId, accessToken);

    // Set jupyter server URL
    const serverURL = `http://${instance.ipAddress}:${this._jupyterPort}`;

    return serverURL;
  }

  private getAccessToken(req: IncomingMessage): string {
    if (!req.headers.cookie) {
      throw new ProxyError(403, 'Forbidden');
    }
    const cookies = cookie.parse(req.headers.cookie);

    const accessToken = cookies['access_token'];
    if (accessToken == null) {
      throw new ProxyError(401, 'Access token not present in cookies');
    }

    return accessToken;
  }

  private getInstanceIdFromPath(path: string): Number {
    const regex = '^\\/jupyter\\/(\\d+)(.*)$';
    const match = path.match(regex)
    if (match != null && match.length >= 1) {
      const instanceId = Number(match[1]);

      if (isNaN(instanceId)) {
        logger.error(`Error proxying Jupyter request : Could not get instance Id from request path ${path}`);
        throw new ProxyError(400, 'Instance Id not present in the path');
      }
  
      return instanceId;
 
    } else {
      logger.error(`Error proxying Jupyter request : Got a non-matching URL ${path}`);
      throw new ProxyError(400, 'Non-matching URL');
    }
  }

  private getInstanceNotebookSessionFromRequest(url: string): InstanceNotebookSession {
    const regex = '^\\/jupyter\\/(\\d+)\\/api\\/kernels\\/([a-f0-9-]+).*session_id=([a-f0-9-]+).*$';
    const match = url.match(regex)
    if (match != null && match.length >= 3) {
      const instanceId = Number(match[1]);
      const kernel = match[2];
      const sessionId = match[3];

      if (isNaN(instanceId)) {
        logger.error(`Could not get instance Id from request url ${url}`);

      } else {
        return new InstanceNotebookSession(instanceId.valueOf(), kernel, sessionId);
      }
    }
    return null;
  }


  private async getAuthorisedInstance(instanceId: Number, accessToken: string): Promise<Instance> {
    try {
      const instance = await this._visaInstanceService.getInstance(instanceId.valueOf(), accessToken);

      return instance;

    } catch (error) {
      logger.error(`Error getting instance with Id ${instanceId}: ${error.message} (${error.statusCode})`);
      throw error;
    }
  }


}