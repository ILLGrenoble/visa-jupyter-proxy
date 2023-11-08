import { Store, logger } from './utils';
import { VisaProxyServer, JupyterHttpProxyMiddleware, ServiceHttpProxyMiddleware } from './proxy';
import { VisaInstanceService, NotebookSessionStorageService } from './services';
import {resolve} from 'path';
import { readFile } from 'fs/promises';
import { ProxyConf } from './models';

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

      const configPath = resolve(__dirname, '../proxy.conf.json');
      const configData = await readFile(configPath, );
      const config = JSON.parse(configData.toString('utf-8')) as ProxyConf[];

      const requestHandlers = config.map(conf => {
        logger.info(`Adding proxy '${conf.name}' for paths matching '${conf.match}'`);
        if (conf.type === 'jupyter') {
          return new JupyterHttpProxyMiddleware(conf, visaInstanceService, notebookSessionStorageService);
        } else if (conf.type === 'service') {
          return new ServiceHttpProxyMiddleware(conf, visaInstanceService);
        }
      });

      this._proxyServer = new VisaProxyServer(requestHandlers);

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

