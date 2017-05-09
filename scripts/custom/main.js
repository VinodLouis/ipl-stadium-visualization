var glb_data;
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

var vis = svg.append("g").attr("id","chartP")

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

    $("#chartP").html("");
    //start the force
    var force = d3.layout.force()
        .nodes(json.nodes)
        .links(json.links)
        .gravity(.04)
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
        .attr("class","node-s-m")
        .style("fill", function(d) {
            return ((d.type == "stadium") ? "#2DC800" : colorYear[d.dataElem.year]) //nodecolor(d.group);
        })
        .on("click",function(e){
             if (d3.event.defaultPrevented) return;
             var d = this.__data__;
             if (d.type == "stadium") return;
             renderTableData(d);
        })
        .on("dblclick.zoom", callZoom)
        .each(function(d){
            $(this).tipsy({
        html: true,
        title: function() {
           var d = this.__data__;
           var strHTML = "<table class='tool-tip-custom' cellspacing='2' cellpadding='3' border='1'>";
           if(d.type == "stadium"){
              strHTML += "<tr><td>" + d.dataElem.fullName + "</td></tr>";
              strHTML += "<tr><td>" + d.dataElem.city + " - " + d.dataElem.country + "</td></tr>";
              strHTML += "</table>";
              return strHTML;
           }
           var dt = new Date(d.dataElem.matchDate);
           var team = (d.dataElem.team1.innings[0].inningsNumber == 1) ? [d.dataElem.team1,d.dataElem.team2] : [d.dataElem.team2,d.dataElem.team1];
           strHTML += '<tr><td colspan="2">' + dt.toDateString() + " , " + dt.toLocaleString().split(",")[1] + '</td></tr>';
           strHTML += "<tr><td><div>" + team[0].team.fullName + "</div><div>" + team[0].innings[0].runs + "/" + team[0].innings[0].wkts + " in " + ((((team[0].innings[0].ballsFaced / 6)%1) == 0) ? (team[0].innings[0].ballsFaced / 6) : Math.floor(team[0].innings[0].ballsFaced / 6) + "." + (team[0].innings[0].ballsFaced % 6)) + " overs </div></td>";
           strHTML += "<td><div>" + team[1].team.fullName + "</div><div>" + team[1].innings[0].runs + "/" + team[1].innings[0].wkts + " in " + ((((team[1].innings[0].ballsFaced / 6)%1) == 0) ? (team[1].innings[0].ballsFaced / 6) : Math.floor(team[1].innings[0].ballsFaced / 6) + "." + (team[1].innings[0].ballsFaced % 6)) + " overs </div></td></tr>";
           strHTML += '<tr><td colspan="2">' + d.dataElem.matchStatus.text + '</td></tr></table><div class="small-font">* Click for more details</div>';
           return strHTML;
        }
      });
        })


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


    function renderTableData(data){
       var dt = new Date(data.dataElem.matchDate);
      var strHTML = '<table cellspacing="2" cellpadding="3">';
       var team = (data.dataElem.team1.innings[0].inningsNumber == 1) ? [data.dataElem.team1,data.dataElem.team2] : [data.dataElem.team2,data.dataElem.team1];
      strHTML += '<tr><td>' + data.dataElem.description + 'of Season ' + data.year + '</td><td>' +  dt.toDateString() + " , " + dt.toLocaleString().split(",")[1] + '</td></tr>';
      strHTML += '<tr><td><div><span class="team-logo ' +  team[0].team.abbreviation + '"></span>' + team[0].team.fullName + "</div><div>" + team[0].innings[0].runs + "/" + team[0].innings[0].wkts + " in " + ((((team[0].innings[0].ballsFaced / 6)%1) == 0) ? (team[0].innings[0].ballsFaced / 6) : Math.floor(team[0].innings[0].ballsFaced / 6) + "." + (team[0].innings[0].ballsFaced % 6)) + " overs </div></td>";
      strHTML += '<tr><td><div><span class="team-logo ' +  team[1].team.abbreviation + '"></span>' + team[1].team.fullName + "</div><div>" + team[1].innings[0].runs + "/" + team[1].innings[0].wkts + " in " + ((((team[1].innings[0].ballsFaced / 6)%1) == 0) ? (team[1].innings[0].ballsFaced / 6) : Math.floor(team[1].innings[0].ballsFaced / 6) + "." + (team[1].innings[0].ballsFaced % 6)) + " overs </div></td></tr>";
      strHTML += "</table>";
      $("#info").html(strHTML);
      console.log(data);
    }

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

function appplyFilters(){
  var teams = [];
  var years = []

  $(".team-logo:not(.inactive)").each(function(el){
    teams.push(this.id);
  });

  $(".year-sel:not(.inactive)").each(function(el){
     years.push(this.id);
   });
  console.log(teams,years);
  var filterData = glb_data.filter(function(el){
    return((el.year && years.indexOf(el.year) !==-1) && ((el.team1.team.abbreviation && teams.indexOf(el.team1.team.abbreviation) !== -1)||(el.team2.team.abbreviation && teams.indexOf(el.team2.team.abbreviation) !== -1)))
  });
  console.log(filterData)
  var graph = processData(filterData);
  drawGraph(graph);
}

$(document).ready(function() {
d3.json("data/matches.json", function(data) {
   glb_data = data;
   appplyFilters();
});

$(".team-logo").tipsy();

$(".team-logo,.year-sel").click(function(ev){
  $(this).toggleClass("inactive");
})

});
