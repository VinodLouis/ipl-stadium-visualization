var w = 1200,
    h = 600
console.log(w,h);
var min_zoom = 1;
var max_zoom = 5;
var zoom = min_zoom;

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
        vis.attr("transform", "translate(" + dcx + "," + dcy + ")scale(" + zoom + ")");
    }
}

function zoomDown(isReset) {
    if (!isReset) {
        zoom = (zoom > 1) ? (zoom - 0.5) : 1;
    } else {
        zoom = 1;
    }
    vis.attr("transform", "scale(" + zoom + ")");
}

function drawGraph(json) {
    //either can use target node weight ot edge weight for time complexity taking the one which has less data
    var minArrayForRange = (json.nodes.length < json.links.length) ? json.nodes : json.links;

    //get all value of weight in single array
    var arrValues = minArrayForRange.map(function(d) {
        return d.value;
    });

    //set the scale for circle radius
    var linearScaleForCircleRadius = d3.scale.linear()
        .domain([Math.min(...arrValues), Math.max(...arrValues)])
        .range([5, 20]);

    //set the scale for stroke width    
    var linearScaleForLineSrtoke = d3.scale.linear()
        .domain([Math.min(...arrValues), Math.max(...arrValues)])
        .range([1, 10]);

    //start the force    
    var force = self.force = d3.layout.force()
        .nodes(json.nodes)
        .links(json.links)
        .gravity(.05)
        .distance(70)
        .charge(-20)
        .size([w, h])
        .start();

    //append marker    
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


    //append edge with mrkers    
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

    //bind drag event for node drag and stay    
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

    //append node
    var node = vis.selectAll("g.node")
        .data(json.nodes)
        .enter().append("svg:g")
        .attr("class", "node")
        .call(node_drag);

    //append circle to node OR can be an image    
    node.append("svg:circle")
        .attr("r", function(d) {
            return linearScaleForCircleRadius(d.value)
        })
        .attr("x", "-8px")
        .attr("y", "-8px")
        .style("fill", function(d) {
            return ((d.type == "p") ? "#A27AFE" : "#CDD11B") //nodecolor(d.group);
        })
        .on("dblclick.zoom", callZoom)

    /*    
    node.append("svg:image")
    
        .attr("xlink:href", function(d) {
                return ((d.type == "p") ? "img/patient.png" : "img/user.png") //nodecolor(d.group);
            })
        .attr("x", function(d,i){ return ((linearScaleForCircleRadius(d.value)/2)*-1) + "px"})
        .attr("y", function(d,i){ return ((linearScaleForCircleRadius(d.value)/2)*-1) + "px"})
        .attr("width", function(d,i){ return (linearScaleForCircleRadius(d.value)) + "px"})
        .attr("height", function(d,i){ return (linearScaleForCircleRadius(d.value)) + "px"})
    .on("dblclick.zoom",callZoom)*/

    //render text
    node.append("svg:text")
        .attr("class", "nodetext")
        .attr("dx", 12)
        .attr("dy", ".35em")
        .text(function(d) {
            return d.name
        });

    force.on("tick", tick);

    //Gaussian eq to get points due to various node size
    function calculatePoint(d, point) {
        diffX = d.target.x - d.source.x;
        diffY = d.target.y - d.source.y;

        pathLength = Math.sqrt((diffX * diffX) + (diffY * diffY));

        offsetX = (diffX * linearScaleForCircleRadius(d.value)) / pathLength;
        offsetY = (diffY * linearScaleForCircleRadius(d.value)) / pathLength;
        
        return [d.target.x - offsetX, d.target.y - offsetY]
    }

    //on tick
    function tick() {
        //TOD may be a bounding box could solve this - gravity and charge is the slug
        //node.attr("cx", function(d) { return d.x = Math.max(linearScaleForCircleRadius(d.value), Math.min(w - linearScaleForCircleRadius(d.value), d.x)); })
        //.attr("cy", function(d) { return d.y = Math.max(linearScaleForCircleRadius(d.value), Math.min(h - linearScaleForCircleRadius(d.value), d.y)); });

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
        //safe check to ensure there is no empty data
        var intPatiendId = (ele.EPIC_PATIENT_ID && !isNaN(ele.EPIC_PATIENT_ID)) ? parseInt(ele.EPIC_PATIENT_ID, 10) : ("unknownPatient" + (unknownPatient));
        var intUserId = (ele.USER_ID && !isNaN(ele.USER_ID)) ? parseInt(ele.USER_ID, 10) : ("unknownUser" + (unknownUser));
        
        //if patient not found add new node
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

        //if user not found add new node
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

        //check if an link already exists between patient-user
        var exisLink = graph.links.find(function(ele) {
            if (byCriteria == "p")
                return (ele.soureElement == intUserId && ele.targetElement == intPatiendId);
            return (ele.soureElement == intPatiendId && ele.targetElement == intUserId);
        });

        //if exists
        if (exisLink) {
            //increase the edge weight and also target node weight
            exisLink.value += 5;
            var target = graph.nodes.find(function(ele) {
                if (byCriteria == "p")
                    return (ele.name == intPatiendId)
                return (ele.name == intUserId)
            });
            target.value += 5;
        } else {
            //else push a new edge from sourve to target
            var source = graph.nodes.find(function(ele) {
                return (ele.name == intUserId)
            });

            var target = graph.nodes.find(function(ele) {
                return (ele.name == intPatiendId)
            });
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
    return graph;
}

d3.csv("data/eee1-extract_10_clean.csv", function(data) {
    //get the csv data pass and get node graph processed data 
    //TODO : "u"/"p" to be decided on basic of userID/patiendID
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