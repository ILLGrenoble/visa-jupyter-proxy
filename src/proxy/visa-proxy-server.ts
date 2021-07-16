import ProxyServer from 'http-proxy';
import http, {IncomingMessage, Server, ServerResponse} from 'http';
import { APPLICATION_CONFIG } from '../application-config';
import { logger } from '../utils';
import { ProxyMiddleWare } from './proxy-middleware';
import { Socket } from 'net';

export class VisaProxyServer {

  private _proxy: ProxyServer;
  private _server: Server;
  private _host: string;
  private _port: number;

  constructor(private _proxyMiddleware: ProxyMiddleWare) {
    this._host = APPLICATION_CONFIG().server.host;
    this._port = APPLICATION_CONFIG().server.port;

    this._proxy = ProxyServer.createProxyServer();

    // Create http server
    this._server = http.createServer((req, res) => this.handleWebRequest(req, res));

    // Handle web-socket requests
    this._server.on('upgrade', (req, socket, head) => this.handleWebsocketUpgrade(req, socket, head));
  }

  start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._server.listen(this._port, this._host, () => {
        logger.info(`Running proxy server at ${this._host}:${this._port}`);
        resolve();
      });
    });
  }

  stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      this._server.close(() => {
        logger.info(`Stopped proxy server`);
        resolve(); 
      })
    });
  }

  private async handleWebRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      logger.debug(`Incoming request ${req.url}`);

      const proxyIntercept = await this._proxyMiddleware.interceptRequest(req);

      logger.debug(`forwarding request ${req.url} to ${proxyIntercept.url}`);
      this._proxy.web(proxyIntercept.request, res, { target: proxyIntercept.url }, (error) => {
        this.handleError(error, req, res);
      });

    } catch(error) {
      this.handleError(error, req, res);
    }
  }

  private async handleWebsocketUpgrade(req: IncomingMessage, socket: Socket, head: any): Promise<void> {
    try {
      logger.debug(`Incoming websocket request ${req.url}`);

      const proxyIntercept = await this._proxyMiddleware.interceptRequest(req);

      this._proxy.ws(proxyIntercept.request, socket, head, { target: proxyIntercept.url }, (error) => {
        this.handleError(error, req);
      });

    } catch (error) {
      this.handleError(error, req);
    }
  }

  private handleError(error: any, req: IncomingMessage, res?: ServerResponse) {
    if (error.statusCode) {
      if (res) {
        res.writeHead(error.statusCode);
        res.write(error.message);
        res.end();
      }

    } else {
      logger.error(`Got error proxying request (${req.url}): ${error.message}`);

      if (res) {
        res.writeHead(500);
        res.write(error.message);
        res.end();
      }
    }
  }

}
