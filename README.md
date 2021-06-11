# VISA Jupyter Proxy

This project contains the source code for the Jupyter Notebook Proxy of the VISA platform.

VISA (Virtual Infrastructure for Scientific Analysis) makes it simple to create compute instances on facility cloud infrastructure to analyse your experimental data using just your web browser.

See the [User Manual](https://visa.readthedocs.io/en/latest/) for deployment instructions and end user documentation.

## Description

This application proxies Jupyter notebook HTTP requests to specific VISA instances.

The VISA Web Application integrates JupyterLab as an iframe and requests to the JupyterLab notebook server are proxied through this application. For security reasons, direct access to the instances is blocked and so the base URL of the Jupyter HTTP requests includes the instance ID to identify which notebook server to use. The VISA Jupyter Proxy uses the API Server to obtain instance data (IP/Port) from the instance ID embedded in the URL. 

To authenticate and authorise the user, the JWT access_token is sent as a cookie in the Juptyer HTTP request and passed as a Bearer header to the API Server. 

The Jupyter Proxy registers the start and end of each notebook session and records this information with the API Server to provide usage metrics.

## Acknowledgements

<img src="https://github.com/panosc-eu/panosc/raw/master/Work%20Packages/WP9%20Outreach%20and%20communication/PaNOSC%20logo/PaNOSClogo_web_RGB.jpg" width="200px"/> 

VISA has been developed as part of the Photon and Neutron Open Science Cloud (<a href="http://www.panosc.eu" target="_blank">PaNOSC</a>)

<img src="https://github.com/panosc-eu/panosc/raw/master/Work%20Packages/WP9%20Outreach%20and%20communication/images/logos/eu_flag_yellow_low.jpg"/>

PaNOSC has received funding from the European Union's Horizon 2020 research and innovation programme under grant agreement No 823852.



