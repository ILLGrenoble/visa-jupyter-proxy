import { IncomingMessage } from 'http';
import { Instance, ProxyConf} from '../models';
import { ProxyMiddleWare } from './proxy-middleware';
import { Duplex } from 'stream';
import { VisaInstanceService } from '../services';

export class ServiceHttpProxyMiddleware extends ProxyMiddleWare{

  constructor(conf: ProxyConf, instanceService: VisaInstanceService) {
    super(conf, instanceService);
  }

  public async init(): Promise<void> {
  }
  
  async onInterceptRequest(req: IncomingMessage, instance: Instance, accessToken: string): Promise<void> {
  }

  async onInterceptWesocketRequest(req: IncomingMessage, socket: Duplex, instance: Instance, accessToken: string): Promise<void> {
  }

}