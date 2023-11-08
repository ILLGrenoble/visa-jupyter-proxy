import { IncomingMessage } from 'http';
import { errMsg, logger } from '../utils';
import { Instance, InstanceNotebookSession, ProxyConf } from '../models';
import { ProxyMiddleWare } from './proxy-middleware';
import { VisaInstanceService, NotebookSessionStorageService } from '../services';
import { Duplex } from 'stream';

export class JupyterHttpProxyMiddleware extends ProxyMiddleWare{

  private _notebookStorageInitialised = false;

  constructor(conf: ProxyConf, visaInstanceService: VisaInstanceService, private _notebookSessionStorage: NotebookSessionStorageService) {
    super(conf, visaInstanceService);
  }

  public async init(): Promise<void> {
    return this.initialiseNotebookSessionStorage();
  }
  
  async onInterceptRequest(req: IncomingMessage, instance: Instance, accessToken: string): Promise<void> {
  }

  async onInterceptWesocketRequest(req: IncomingMessage, socket: Duplex, instance: Instance, accessToken: string): Promise<void> {
    logger.debug(`got connection to Jupyter socket for instance ${instance.id}`);

    const instanceNotebookSession = this.getInstanceNotebookSessionFromRequest(req.url);
    if (instanceNotebookSession != null) {

      // Notify api server of jupyter session start
      await this._visaInstanceService.onJupyterNotebookOpened(instanceNotebookSession, accessToken);
  
      // Add notebook session to persistence
      await this._notebookSessionStorage.addInstanceNotebookSessionToStorage(instanceNotebookSession);

      socket.on('close', async () => {
        logger.debug(`Jupyter socket closed for instance ${instance.id}`);
 
        try {
          // Notify api server of jupyter session end
          await this._visaInstanceService.onJupyterNotebookClosed(instanceNotebookSession);
    
          // Remove notebook session from persistence
          await this._notebookSessionStorage.removeInstanceNotebookSessionFromStorage(instanceNotebookSession);
          
        } catch (error) {
          logger.warning(`Error caught when closing the notebook: ${errMsg(error)}`);
        }
      });
    }
  }

  private async initialiseNotebookSessionStorage(): Promise<void> {
    if (!this._notebookStorageInitialised) {
      // Clear any previously open notebook sessions
      const zombieInstanceNotebookSessions = await this._notebookSessionStorage.eraseInstanceNotebookSessionInStorage();
      for (const instanceNotebookSession of zombieInstanceNotebookSessions) {
        logger.debug(`Erasing zombie Jupyter notebook session for kernel ${instanceNotebookSession.kernel} with sessionId ${instanceNotebookSession.sessionId}`);
        try {
          await this._visaInstanceService.onJupyterNotebookClosed(instanceNotebookSession);

        } catch (error) {
          logger.warning(`Error caught when closing the notebook: ${errMsg(error)}`);
        }
      }

      this._notebookStorageInitialised = true;
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

}