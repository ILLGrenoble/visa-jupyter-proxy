export interface RewriteRule {
    [key: string]: string;
}

export interface ProxyConf {
    match: string,
    type: 'jupyter' | 'service',
    name: string,
    remotePort: number,
    ws?: boolean,
    pathRewrite?: RewriteRule,
}