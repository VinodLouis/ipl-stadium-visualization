var w = 1200,
    h = 600
console.log(w,h);
var min_zoom = 1;
var max_zoom = 5;
var zoom = min_zoom;
var colorYear = {
    "2008" : "#c3cb71",
    "2009" : "#559e83",
    "2010" : "#1b85b8",
    "2011" : "#9669FE",
    "2012" : "#FF68DD",
    "2013" : "#03EBA6",
    "2014" : "#B6BA18",
    "2015" : "#B6BA18",
    "2016" :  "#FFB347"
};

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
   

    //start the force    
    var force = d3.layout.force()
        .nodes(json.nodes)
        .links(json.links)
        .gravity(.05)
        .distance(70)
        .charge(-20)
        .size([w, h])
        .start();

   

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
        //.attr("marker-end", "url(#arrow)");

    //bind drag event for node drag and stay    
    var node_drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragstart(d, i) {
        d3.event.sourceEvent.stopPropagation();
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
            return ((d.type == "stadium") ? 20 : 10)
        })
        .attr("x", "-8px")
        .attr("y", "-8px")
        .style("fill", function(d) {
            return ((d.type == "stadium") ? "#2DC800" : colorYear[d.dataElem.year]) //nodecolor(d.group);
        })
        .on("click",function(e){
             if (d3.event.defaultPrevented) return;
             console.log("clicked");
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
            if(d.type == "stadium")
                return d.dataElem.shortName;
            
            return d.dataElem.team1.team.abbreviation + " Vs " + d.dataElem.team2.team.abbreviation;  
            
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
                return d.target.x; //calculatePoint(d)[0];
            })
            .attr("y2", function(d) {
                return d.target.y; //calculatePoint(d)[1];
            })

        node.attr("transform", function(d) {
            return "translate(" + d.x + "," + d.y + ")";
        });
    };
}


function processData(data) {
    var stadiumList = [];
    var graph = {
        "nodes": [],
        "links": []
    };
    
    data.forEach(function(ele) {
        
        if(!ele.venue)
            return;
        //if patient not found add new node
        if (stadiumList.indexOf(ele.venue.id) == -1) {
            graph.nodes.push({
                "index": graph.nodes.length,
                "stadiumId": ele.venue.id,
                "dataElem" : ele.venue,
                "matchId":"NA",
                "group": graph.nodes.length,
                "type": "stadium"
            });
            stadiumList.push(ele.venue.id);
        }

        graph.nodes.push({
            "index": graph.nodes.length,
            "dataElem": ele,
            "stadiumId": "NA",
            "matchId":ele.year +"_"+ele.id,
            "group": graph.nodes.length,
            "type": "match"
        });


        var source = graph.nodes.find(function(el) {
            return (el.stadiumId == ele.venue.id)
        });

            var target = graph.nodes.find(function(el) {
                return (el.matchId == ele.year +"_"+ele.id)
            });
            graph.links.push({
                source: source.index,
                target: target.index,
                type: "arrow"
            })
    });        
    return graph;
}

d3.csv("data/eee1-extract_10_clean.csv", function(data) {
    //get the csv data pass and get node graph processed data 
    //TODO : "u"/"p" to be decided on basic of userID/patiendID
    var graph = processData(data, "u");
    //drawGraph(graph);
});

d3.json("data/matches.json", function(data) {
    
    var graph = processData(data, "u");
    console.log(graph);
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