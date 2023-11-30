import ProxyServer from 'http-proxy';
import http, {IncomingMessage, Server, ServerResponse} from 'http';
import { APPLICATION_CONFIG } from '../application-config';
import { logger } from '../utils';
import { ProxyMiddleWare } from './proxy-middleware';
import { Duplex } from 'stream';

export class VisaProxyServer {

  private _proxy: ProxyServer;
  private _server: Server;
  private _host: string;
  private _port: number;

  constructor(private _requestHandlers: ProxyMiddleWare[]) {
    this._host = APPLICATION_CONFIG().server.host;
    this._port = APPLICATION_CONFIG().server.port;

    this._proxy = ProxyServer.createProxyServer({});

    // Create http server
    this._server = http.createServer((req, res) => this.handleWebRequest(req, res));

    // Handle web-socket requests
    this._server.on('upgrade', (req, socket, head) => this.handleWebsocketUpgrade(req, socket, head));
  }

  async start(): Promise<void> {
    for (const requestHandler of this._requestHandlers) {
      await requestHandler.init();
    }

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
    logger.debug(`Incoming request ${req.url}...`);

    const requestHandler = this.findRequestHandler(req);
    logger.debug(`... found handler '${requestHandler.name}' for request ${req.url}`);
    if (requestHandler) {
      const incomingPath = req.url;
      try {
        const response = await requestHandler.interceptRequest(req);

        logger.debug(`Forwarding request ${incomingPath} to instance ${response.instance.id} at ${response.target}${req.url}`);
        this._proxy.web(req, res, { target: response.target}, (error) => {
          this.handleError(error, requestHandler, incomingPath, res);
        });

      } catch(error) {
        this.handleError(error, requestHandler, incomingPath, res);
      }
  
    } else {
      logger.debug(`... no handler found for websocket request ${req.url}`);
    }
  }

  private async handleWebsocketUpgrade(req: IncomingMessage, socket: Duplex, head: any): Promise<void> {
    logger.debug(`Incoming websocket request ${req.url}...`);
    const requestHandler = this.findWebsocketRequestHandler(req);
    if (requestHandler) {
      logger.debug(`... found handler '${requestHandler.name}' for websocket request ${req.url}`);
      const incomingPath = req.url;
      try {
        const response = await requestHandler.interceptWesocketRequest(req, socket);
  
        logger.debug(`Forwarding websocket request ${incomingPath} to instance ${response.instance.id} at ${response.target}${req.url}`);
        this._proxy.ws(req, socket, head, { target: response.target }, (error) => {
          this.handleError(error, requestHandler, incomingPath);
        });
  
        // Listen to websocket data: update last interaction at on instance
        // socket.on('data', (data: Buffer) => {
        //   console.log('got a message: ' + data);
        // })
  
      } catch (error) {
        this.handleError(error, requestHandler, incomingPath);
      }
    
    } else {
      logger.debug(`... no handler found for websocket request ${req.url}`);
    }
  }

  private findRequestHandler(req: IncomingMessage): ProxyMiddleWare {
    return this._requestHandlers.find(handler => handler.handlesRequest(req));
  }

  private findWebsocketRequestHandler(req: IncomingMessage): ProxyMiddleWare {
    return this._requestHandlers.filter(handler => handler.isWebsocketHandler()).find(handler => handler.handlesRequest(req));
  }

  private handleError(error: any, handler: ProxyMiddleWare, incomingPath: string, res?: ServerResponse) {
    if (error.statusCode) {
      if (res) {
        res.writeHead(error.statusCode);
        res.write(error.message);
        res.end();
      }

    } else {
      logger.error(`Handler '${handler.name}' in error proxying request (${incomingPath}): ${error.message}`);

      if (res) {
        res.writeHead(500);
        res.write(error.message);
        res.end();
      }
    }
  }

}
