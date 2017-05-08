var w = 1200,
    h = 600

var min_zoom = 1;
var max_zoom = 5;
var zoom = min_zoom;
//var zoom = d3.behavior.zoom().scaleExtent([min_zoom,max_zoom])*/

var svg = d3.select("#chart").append("svg:svg")
    .attr("width", w)
    .attr("height", h)
    .attr("class", "graph-svg-component");

var vis = svg.append("g")

function callZoom(d) {
    d3.event.stopPropagation();
    if (zoom < max_zoom) {
        zoom += 0.5;
        var dcx = (w / 2 - d.x * zoom);
        var dcy = (h / 2 - d.y * zoom);
        //zoom.translate([dcx,dcy]);
        vis.attr("transform", "translate(" + dcx + "," + dcy + ")scale(" + zoom + ")");
    }
    //alert(zoom.scale())
}

function zoomDown(isReset) {
    if (!isReset) {
        zoom = (zoom > 1) ? (zoom - 0.5) : 1;
    } else {
        zoom = 1;
    }
    vis.attr("transform", "scale(" + zoom + ")");
}

/*zoom.on("zoom", function() {
   svg.call(zoom)
})*/

function drawGraph(json) {
    var minArrayForRange = (json.nodes.length < json.links.length) ? json.nodes : json.links;

    var arrValues = minArrayForRange.map(function(d) {
        return d.value;
    });

    var linearScaleForCircleRadius = d3.scale.linear()
        .domain([Math.min(...arrValues), Math.max(...arrValues)])
        .range([15, 40]);

    var linearScaleForLineSrtoke = d3.scale.linear()
        .domain([Math.min(...arrValues), Math.max(...arrValues)])
        .range([1, 10]);

    var force = self.force = d3.layout.force()
        .nodes(json.nodes)
        .links(json.links)
        .gravity(.05)
        .distance(70)
        .charge(-40)
        .size([w, h])
        .start();

    svg.insert('defs', ':first-child')
        .append('marker')
        .attr('id', 'arrow')
        .attr('markerUnits', 'userSpaceOnUse')


    .attr("viewBox", "0 -5 10 10")
        .attr("refX", 15)
        .attr("refY", -1.5)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("svg:path")
        .attr("d", "M0,-5L10,0L0,5");



    var link = vis.selectAll("line.link")
        .data(json.links)
        .enter().append("svg:line")
        .attr("class", "link")
        .attr("x1", function(d) {
            return d.source.x;
        })
        .attr("y1", function(d) {
            return d.source.y;
        })
        .attr("x2", function(d) {
            return d.target.x;
        })
        .attr("y2", function(d) {
            return d.target.y;
        })
        .attr("stroke-width", function(d) {
            return linearScaleForLineSrtoke(d.value);
        })
        .attr("marker-end", "url(#arrow)");

    var node_drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy;
        tick(); // this is the key to make it work together with updating both px,py,x,y on d !
    }

    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        tick();
        force.resume();
    }


    var node = vis.selectAll("g.node")
        .data(json.nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .call(node_drag);

    /*    
    node.append("svg:circle")
        .attr("r", function(d) {
            return linearScaleForCircleRadius(d.value)
        })
        .attr("x", "-8px")
        .attr("y", "-8px")
        .style("fill", function(d) {
            return ((d.type == "p") ? "#A27AFE" : "#CDD11B") //nodecolor(d.group);
        })
        .on("dblclick.zoom", callZoom)*/

        
    node.append("svg:image")
        .attr("xlink:href", function(d) {
                return ((d.type == "p") ? "img/patient.png" : "img/user.png") //nodecolor(d.group);
            })
        .attr("x", function(d,i){ return ((linearScaleForCircleRadius(d.value)/2)*-1) + "px"})
        .attr("y", function(d,i){ return ((linearScaleForCircleRadius(d.value)/2)*-1) + "px"})
        .attr("width", function(d,i){ return (linearScaleForCircleRadius(d.value)) + "px"})
        .attr("height", function(d,i){ return (linearScaleForCircleRadius(d.value)) + "px"})
        .on("dblclick.zoom",callZoom)

    node.append("svg:text")
        .attr("class", "nodetext")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.name
        });

    force.on("tick", tick);

    function calculatePoint(d, point) {
        diffX = d.target.x - d.source.x;
        diffY = d.target.y - d.source.y;

        pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));

        offsetX = (diffX * linearScaleForCircleRadius(d.value)) / pathLength;
        offsetY = (diffY * linearScaleForCircleRadius(d.value)) / pathLength;


        return [d.target.x - offsetX, d.target.y - offsetY]

    }

    function tick() {
        link.attr("x1", function(d) {
                return d.source.x;
            })
            .attr("y1", function(d) {
                return d.source.y;
            })
            .attr("x2", function(d) {
                return calculatePoint(d)[0];
            })
            .attr("y2", function(d) {
                return calculatePoint(d)[1];
            })

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });

        // vis.attr("transform", "scal e offsetX, d.target.y - 
    };
}


function processData(data, centric) {
    var patientList = [];
    var usersList = [];
    var graph = {
        "nodes": [],
        "links": []
    };

    var unknownPatient = 0;
    var unknownUser = 0;
    var byCriteria = centric;
    data.forEach(function(ele) {
        var intPatiendId = (ele.EPIC_PATIENT_ID && !isNaN(ele.EPIC_PATIENT_ID)) ? parseInt(ele.EPIC_PATIENT_ID, 10) : ("unknownPatient" + (unknownPatient));
        var intUserId = (ele.USER_ID && !isNaN(ele.USER_ID)) ? parseInt(ele.USER_ID, 10) : ("unknownUser" + (unknownUser));
        //console.log(intPatiendId,intUserId)
        if (patientList.indexOf(intPatiendId) == -1) {
            graph.nodes.push({
                "name": intPatiendId,
                "index": graph.nodes.length,
                "dataElem": ele,
                group: graph.nodes.length,
                type: "p",
                value: 30
            });
            patientList.push(intPatiendId);
        }

        if (usersList.indexOf(intUserId) == -1) {
            graph.nodes.push({
                "name": intUserId,
                "index": graph.nodes.length,
                "dataElem": ele,
                group: graph.nodes.length,
                type: "u",
                value: 30
            });
            usersList.push(intUserId);
        }

        var exisLink = graph.links.find(function(ele) {
            if (byCriteria == "p")
                return (ele.soureElement == intUserId && ele.targetElement == intPatiendId);
            return (ele.soureElement == intPatiendId && ele.targetElement == intUserId);
        });

        if (exisLink) {
            exisLink.value += 5;
            var target = graph.nodes.find(function(ele) {
                if (byCriteria == "p")
                    return (ele.name == intPatiendId)
                return (ele.name == intUserId)
            });
            target.value += 5;
        } else {

            var source = graph.nodes.find(function(ele) {
                return (ele.name == intUserId)
            });

            var target = graph.nodes.find(function(ele) {
                return (ele.name == intPatiendId)
            });
            //console.log(source,intPatiendId,target,graph,ele)
            graph.links.push({
                source: (byCriteria == "p") ? source.index : target.index,
                target: (byCriteria == "p") ? target.index : source.index,
                value: 30,
                soureElement: (byCriteria == "p") ? source.name : target.name,
                targetElement: (byCriteria == "p") ? target.name : source.name,
                type: "arrow"
            })
        }
    });
    console.log(patientList,usersList);
    return graph;
}

d3.csv("data/by_userID.csv", function(data) {
    var graph = processData(data, "u");
    drawGraph(graph);
});

$(document).ready(function() {
    var startDateTextBox = $('#rangeDateTimeStart');
    var endDateTextBox = $('#rangeDateTimeEnd');
    
    $.timepicker.datetimeRange(
      startDateTextBox,
      endDateTextBox,
      {
        minInterval: (1000*60*60), // 1hr
        dateFormat: 'dd M yy', 
        timeFormat: 'HH:mm:ss',
        start: {}, // start picker options
        end: {} // end picker options         
      }
    );
});