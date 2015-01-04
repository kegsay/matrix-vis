This script visualises the graph formed by Matrix events in a room.

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
 - The target home server returns a ``prev_events`` key which looks like:
 
     ```
     prev_events: [
       [ event_id, { sha256: "hash" } ]
     ]
     ```
    
 - Event IDs are formatted as ``blob:domain`` (for colouring nodes based on domain).

