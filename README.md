This script visualises the graph formed by Matrix events in a room.

![Example](https://raw.githubusercontent.com/Kegsay/matrix-vis/master/federation.png)

Features:
 - Displays the event graph for a room visually.
 - Display individual event JSON when selected.
 - Can read from the event stream to add new events to the graph in realtime.
 - Can perform scrollback on a room to collect earlier events (up to the root)
 - Different node colours for different servers.

Requires:
 - "npm install vis"

Usage:
 - Host this folder (e.g. ``python -m SimpleHTTPServer``)
 - Visit index.html and enter in your information.
  
Assumptions:
 - Event IDs are formatted as ``blob:domain`` (for colouring nodes based on domain).

