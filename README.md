# VISA Jupyter Proxy

The VISA Jupyter Proxy provides an HTTP proxy forwarding request to Jupyter Notebooks on the VISA platform, as well as a more general HTTP proxy for other service running on a VISA instance.

Originally designed uniquely for the Jupyter requirements, the proxy has been generalised to:
 - forward requests to a VISA instance
 - ensure that the requests are fully authenticated
 - determine the instance from an incoming URL
 - verify that a user has access rights to an intance
 - rewrite paths to the instance service if needed

VISA (Virtual Infrastructure for Scientific Analysis) makes it simple to create compute instances on facility cloud infrastructure to analyse your experimental data using just your web browser.

See the [User Manual](https://visa.readthedocs.io/en/latest/) for deployment instructions and end user documentation.

## Description

This application proxies HTTP requests to services running on specific VISA instances. 

For security reasons, direct access to VISA instances is blocked. To ensure that the user performing the request has access, the incoming URL must include the instance Id and the `authorization` header or `access_token` cookie must be set. The server verifies with the VISA API Server that the user has access to the specific instance and returns the instance details (IP and port).

Have verified a user's authorisation to access an instance, the requets URL is generated and the request forwarded accordingly.

The file `proxy.conf.json` describes all the required proxy services.

### Jupyter proxy details

The VISA Web Application integrates JupyterLab as an iframe and requests to the JupyterLab notebook server are proxied through this application.

To authenticate and authorise the user, the JWT access_token is sent as a cookie in the Juptyer HTTP request (since we use an iframe for JupyterLab the request header cannot be modified) and passed as a Bearer header to the API Server. 

The Jupyter Proxy registers the start and end of each notebook session and records this information with the API Server to provide usage metrics.

## Proxy configuration

The `proxy.conf.json` file at the root of the project includes the following example data:

```
[
    {
        "match":  "^/jupyter/(\\d+).*", 
        "type": "jupyter",
        "name": "Jupyter",
        "remotePort": 8888,
        "ws": true
        "pathRewrite": {
            "^/jupyter/\\d+/": "/"
        }
    },
    ...
]
```

 - `match`: regular expression for the incoming path matching : NOTE this must include a _group_ to obtain the instance Id
 - `type`: the type of service (either `jupyter` or more generic `service`)
 - `name`: an arbitrary name for logging
 - `remotePort`: The remote port on the instance for the service
 - `ws` (optional, default `false`): specify wheter the proxy is used for websockets as well
 - `pathRewrite` (optional): a Set of rules for path pattern matching/replacement (in the example above for example `/jupyter/1234/a/b/c` is replaced with `/a/b/c`)

## Acknowledgements

<img src="https://github.com/panosc-eu/panosc/raw/master/Work%20Packages/WP9%20Outreach%20and%20communication/PaNOSC%20logo/PaNOSClogo_web_RGB.jpg" width="200px"/> 

VISA has been developed as part of the Photon and Neutron Open Science Cloud (<a href="http://www.panosc.eu" target="_blank">PaNOSC</a>)

<img src="https://github.com/panosc-eu/panosc/raw/master/Work%20Packages/WP9%20Outreach%20and%20communication/images/logos/eu_flag_yellow_low.jpg"/>

PaNOSC has received funding from the European Union's Horizon 2020 research and innovation programme under grant agreement No 823852.



