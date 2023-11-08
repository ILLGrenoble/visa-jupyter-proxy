export class ApplicationConfig {
  logging: {
    level: string;
    timezone: string;
    syslog: {
      host: string,
      port: number,
      appName: string
    }
  };

  server: {
    host: string,
    port: number,
  }

  api: {
    host: string,
    port: number
  }

  cache: {
    refreshTimeS: number
  }

  storage: {
    dir: string
  }

  constructor(data?: Partial<ApplicationConfig>) {
    Object.assign(this, data);
  }
}

let applicationConfig: ApplicationConfig;

export function APPLICATION_CONFIG(): ApplicationConfig {
  if (applicationConfig == null) {
    applicationConfig = {
      logging: {
        level: process.env.VISA_JUPYTER_PROXY_LOG_LEVEL == null ? 'info' : process.env.VISA_JUPYTER_PROXY_LOG_LEVEL,
        timezone: process.env.VISA_JUPYTER_PROXY_LOG_TIMEZONE,
        syslog: {
          host: process.env.VISA_JUPYTER_PROXY_LOG_SYSLOG_HOST,
          port: process.env.VISA_JUPYTER_PROXY_LOG_SYSLOG_PORT == null ? null : +process.env.VISA_JUPYTER_PROXY_LOG_SYSLOG_PORT,
          appName: process.env.VISA_JUPYTER_PROXY_LOG_SYSLOG_APP_NAME,
        }
      },
      server: {
        host: process.env.VISA_JUPYTER_PROXY_SERVER_HOST == null ? '0.0.0.0' : process.env.VISA_JUPYTER_PROXY_SERVER_HOST,
        port: process.env.VISA_JUPYTER_PROXY_SERVER_PORT == null ? 8088 : +process.env.VISA_JUPYTER_PROXY_SERVER_PORT
      },
      api: {
        host: process.env.VISA_JUPYTER_PROXY_API_HOST == null ? 'localhost' : process.env.VISA_JUPYTER_PROXY_API_HOST,
        port: process.env.VISA_JUPYTER_PROXY_API_PORT == null ? 8086 : +process.env.VISA_JUPYTER_PROXY_API_PORT
      },
      cache: {
        refreshTimeS: process.env.VISA_JUPYTER_PROXY_CACHE_REFRESH_TIME_S == null ? 60 : +process.env.VISA_JUPYTER_PROXY_CACHE_REFRESH_TIME_S
      },
      storage: {
        dir: process.env.VISA_JUPYTER_PROXY_STORAGE_DIR == null ? 'data' : process.env.VISA_JUPYTER_PROXY_STORAGE_DIR
      }
    };
  }

  return applicationConfig;
}
