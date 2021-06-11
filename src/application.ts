import { Store, logger } from './utils';
import { VisaProxyServer, JupyterHttpProxyMiddleware } from './proxy';
import { VisaInstanceService, NotebookSessionStorageService } from './services';

export class Application {

  private _proxyServer: VisaProxyServer;

  constructor() {
  }

  async start(): Promise<null> {
    if (!this._proxyServer) {
      // Start the proxy server
      logger.info('Starting application');

      const store = new Store();
      const notebookSessionStorageService: NotebookSessionStorageService = new NotebookSessionStorageService(store);
      const visaInstanceService = new VisaInstanceService();
      const jupyterProxyMiddleware = new JupyterHttpProxyMiddleware(visaInstanceService, notebookSessionStorageService);
      await jupyterProxyMiddleware.initialiseNotebookSessionStorage();

      this._proxyServer = new VisaProxyServer(jupyterProxyMiddleware);

      await this._proxyServer.start();
      logger.info('Application running');
    }

    return null;
  }

  async stop(): Promise<null> {
    if (this._proxyServer) {
      logger.info('Stopping application');
      await this._proxyServer.stop();
      logger.info('Proxy server stopped');
      this._proxyServer = null;
    }
    
    return null;
  }

}

