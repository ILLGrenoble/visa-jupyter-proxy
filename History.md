3.2.0 14/04/2025
================
 * Update to Node 22
 * Update all dependencies

3.1.0 12/12/2024
================
 * Release version of VISA 3.X: tag alignment of visa-api-server, visa-web, visa-accounts and visa-jupyter-proxy

3.0.0 15/11/2024
================
 * Update github pipeline
 * Update to dual license

2.11.0 09/01/2024
================
 * Add config for visa-print server
 * Fix logging on websocket proxy when not found

2.10.0 20/11/2023
================
 * Generalise the proxy to allow multiple services to be proxied. All require authentication/authorisation, jupyter service performs additional metrics on the api server. Path rewrites possible.

2.9.0 16/10/2023
================

2.8.1 10/05/2023
================
 * Catch exceptions correctly when closing notebooks.

2.8.0 28/04/2023
================
 * Update to node 20 and update all packages.

2.7.0 20/04/2022
================

2.6.0 21/03/2023
================

2.5.0 20/12/2022
================

2.4.0 25/10/2022
================

2.3.0 01/09/2022
================

2.2.0 22/03/2022
================

2.1.0 17/11/2021
================
 * Update docker node runtime to version 14

2.0.2 30/09/2021
================

2.0.1 16/07/2021
================
 * Fix npm start script

2.0.0 15/06/2021
================
 * VISA platform open sourced and moved to GitHub

1.0.23 30/04/2021
=================
 * Add bottleneck before local-storage calls to ensure only one concurrent access at a time
 * Checking if there are cookies sent in the request

1.0.22 22/01/2021
=================

1.0.21 13/01/2021
=================

1.0.20 30/11/2020
=================

1.0.19 19/11/2020
=================

1.0.18 13/11/2020
=================
 * Fix websocket connections for terminals: don't assume all WSs are notebooks (URL regex) and check that InstanceNotebookSession is not null
 * Modify api-server jupyter endpoints

1.0.17 26/10/2020
=================
 * Cleanup session data on startup
 * Call visa-api endpoint on notebook session open and close (statistical purposes)
 * Add local storage for notebook sessions
 * Add socket listener to monitor notebook session open and close actions
 * Add syslog and manage logging timezones

Initial 15/10/2020
==================
 * Use node http-proxy to forward requests
 * Decode request url to obtain instance Id
 * Use VISA API to authenticate/authorise user and obtain instance data
 * Call instance/keepalive on VISA API to ensure instance isn't expired early
 * Obtain IP address from instance data and forward Jupyter request to notebook server running on the instance
