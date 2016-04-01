var nodes = null;
var edges = null;
var network = null;


var url = null;
var token = null;
var roomId = null;
var streaming = null;
var stepSize = 5;
var collapseEvents = true;

var streamFrom = null;
var scrollbackFrom = null;
var $ = require("jquery");
var vis=require("vis");

window.init=function() {
    initGraph();
     $("#connectButton").on("click", function() {
        url = $("#inputUrl").val();
        token = $("#inputToken").val();
        roomId = $("#inputRoomId").val();
        streaming = $("#inputStreaming").is(":checked");
        stepSize = $("#stepSize").val();
        collapseEvents = $("#collapseEvents").is(":checked");
        initialSync();
    });
    $("#scrollbackButton").on("click", function() {
        scrollback();
    });
}

function initialSync() {
    var urlp;
    urlp="/_matrix/client/api/v1/initialSync?access_token=$token&limit=$stepSize&raw=yep";
    var endpoint=url+urlp;
    endpoint = endpoint.replace("$token", token);
    endpoint = endpoint.replace("$stepSize", stepSize);
    $.getJSON(endpoint, function(data) {
        streamFrom = data.end;
        for (var i=0; i<data.rooms.length; ++i) {
            var room = data.rooms[i];
            if (room.room_id === roomId) {
                // add new events to graph
                console.log("Adding "+room.messages.chunk.length
                             +"new events to the graph");
                for (var j=0; j<room.messages.chunk.length; ++j) {
                    addEvent(room.messages.chunk[j]);
                }
                scrollbackFrom = room.messages.start;
                break;
            }
        }
        if (collapseEvents) {
            collapseNodes();
        }
        if (streaming) {
            console.log("Starting event stream");
            longpollEventStream();
        }
    }).fail(function(err) {
        console.error("Failed to do initial sync: "+JSON.stringify(err));
    });
}
function longpollEventStream() {
    var urlp;
    urlp="/_matrix/client/api/v1/events?access_token=$token&from=$from&raw=yep";
    var endpoint = url + urlp ;
    endpoint = endpoint.replace("$token", token);
    endpoint = endpoint.replace("$from", streamFrom);
    $.getJSON(endpoint, function(data) {
        streamFrom = data.end;
        if (data.chunk.length > 0) {
            console.log("Got "+data.chunk.length+" new events.");
        }
        for (var i=0; i<data.chunk.length; ++i) {
            if (data.chunk[i].room_id === roomId) {
                // add new event to graph
                console.log("Adding new event to graph");
                addEvent(data.chunk[i]);
            }
        }
        longpollEventStream();
    }).fail(function(err) {
        setTimeout(longpollEventStream, 5000);
    });
}

function initGraph() {
    nodes = new vis.DataSet();
    edges = new vis.DataSet();
    // create a network
    var container = document.getElementById('eventGraph');
    var data = {
        nodes: nodes,
        edges: edges
    };
    var options = {
        stabilize: false,
        nodes: {
            shape: "box"
        }
    };
    network = new vis.Network(container, data, options);
    // add event listeners
    network.on('select', function(params) {
        if (params.nodes.length === 1) {
            t1="Event Type : "+nodes.get(params.nodes[0]).blob.type;
            t2="Creator : "+nodes.get(params.nodes[0]).blob.sender;
            if (nodes.get(params.nodes[0]).blob.type=="m.room.member") {
                t3="Action : "+
                nodes.get(params.nodes[0]).blob.content.membership;
            }
            else if (nodes.get(params.nodes[0]).blob.type=="m.room.message") {
                   t3="Message : "+
                   nodes.get(params.nodes[0]).blob.content.body;
            }
            var details_array=[t1, t2, t3];
        }
        document.getElementById('eventInfo').innerHTML = details_array.join('<br>');
    });
    network.on("resize", function(params) {
        console.log(params.width, params.height);
    });
}

function collapseNodes() {
    console.log("Collapsing nodes...");
    // network.nodes => { "eventid": Node, ... }
    // Node.edges => [Edge, Edge] (for the middle node in NODE--->NODE--->NODE)
    // Edge => from=Node, to=Node, fromId=event_id, toId=event_id
}

function addEvent(event) {
    try {
        // extract the origin event domain for colouring based on group... bit cheeky.
        var segments = event.event_id.split(":");
        var domain = segments[segments.length-1];
        nodes.add({
            id: event.event_id,
            label: event.event_id,
            group: domain,
            blob: event
        });
        // Add edges from prev_events (NB: requires hack on synapse currently)
        // on events/utils.py:126 to not del d["prev_events"]
        for (var i=0; i<event.prev_events.length; ++i) {
            var prev_event_id = event.prev_events[i][0];
            edges.add({
                from: prev_event_id,
                to: event.event_id,
                style: "arrow"
            });
        }
    }
    catch (err) {
        console.error("Failed to addEvent: "+err);
    }
}

function scrollback() {
    var urlp1, urlp2;
    urlp1="/_matrix/client/api/v1/rooms/$roomid/messages?";
    urlp2="access_token=$token&from=$from&dir=b&limit=$stepSize&raw=yep";
    var endpoint = url + urlp1 + urlp2;
    endpoint = endpoint.replace("$token", token);
    endpoint = endpoint.replace("$from", scrollbackFrom);
    endpoint = endpoint.replace("$roomid", roomId);
    endpoint = endpoint.replace("$stepSize", stepSize);
    $.getJSON(endpoint, function(data) {
        scrollbackFrom = data.end;
        if (data.chunk.length > 0) {
            console.log("Got "+data.chunk.length+" old scrollback events.");
        }
        for (var i=0; i<data.chunk.length; ++i) {
            if (data.chunk[i].room_id === roomId) {
                // add new event to graph
                console.log("Adding new event to graph");
                addEvent(data.chunk[i]);
            }
        }
        if (collapseEvents) {
            collapseNodes();
        }
    }).fail(function(err) {
        console.error("Failed to perform scrollback: "+JSON.stringify(err));
    });
}
