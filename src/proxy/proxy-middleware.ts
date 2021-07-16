import { IncomingMessage } from 'http';
import { Socket } from 'net';

export interface ProxyIntercept {
  url: string;
  request: IncomingMessage;
}

export interface ProxyMiddleWare {
  /**
   * Intercept an HTTP request and determine return the proxy URL and modified request
   * @param req the incoming request
   */
  interceptRequest(req: IncomingMessage): Promise<ProxyIntercept>;

  /**
   * Intercept a Websocket upgrade request and determine the proxy URL and modified request
   * @param req the incoming request
   */
  interceptWesocketRequest(req: IncomingMessage, socket: Socket): Promise<ProxyIntercept>;

}