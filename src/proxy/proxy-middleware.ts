import { IncomingMessage } from 'http';
import { Duplex } from 'stream';

export interface ProxyMiddleWare {
  /**
   * Intercept an HTTP request and determine return the proxy URL
   * @param req the incoming request
   */
  interceptRequest(req: IncomingMessage): Promise<string>;

  /**
   * Intercept a Websocket upgrade request and determine the proxy URL
   * @param req the incoming request
   */
  interceptWesocketRequest(req: IncomingMessage, socket: Duplex): Promise<string>;

}