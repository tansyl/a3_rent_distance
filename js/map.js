var data = [30, 86, 168, 281, 303, 365];

hist = d3.select(".chart")
  .selectAll("div")
  .data(data)
    .enter()
    .append("div")
    .style("width", function(d) { return d + "px"; })
    .text(function(d) { return d; });

var width = 960,
    height = 700;
    radius = 6,
    fill = "rgba(255, 49, 255, 0.388)",
    stroke = "rgba(0, 0, 0, 0.5)",
    strokeWidth = 0.1;

var selectWorkLoc = false;
document.getElementById('selectPt').onclick = function(){
  selectWorkLoc = true; console.log(selectWorkLoc);
  d3.selectAll('#workloc').remove();
};

console.log();

// Define color scale
var color = d3.scaleLinear()
  .domain([1, 20])
  .clamp(true)
  .range(['#fff', '#409A99']);

var albersProjection = d3.geoAlbers()
    .scale( 100000 )
    .rotate( [73.977,0] )
    .center( [0, 40.753] )
    .translate( [width/2,height/2] );

var geoPath = d3.geoPath()
    .projection( albersProjection );



var svg = d3.select("#mapcontainer").append("svg")
    .attr("width", width)
    .attr("height", height);

d3.queue()
    .defer(d3.json, "data/ny.json")
    .defer(d3.csv, "data/Rent_2017_5yr.csv")
    .await(ready);

function findCenterCoord(l) {
  return math.mean([math.max(l,0), math.min(l,0)],0);
}

function ready(error, us, rent) {
  if (error) throw error;

  // console.log(rent);
  
  var rentByGeoid = {}; // Create empty object for holding dataset
  rent.forEach(function(d) {
    // console.log(d['Geographic Identifier']);
    // console.log(d['Geographic Identifier'].substr(7,));
    // console.log(d);
    rentByGeoid[parseFloat(d['Geographic Identifier'].substr(7,))] = + parseFloat(d['Median Gross Rent']);
  });

  console.log(rentByGeoid[360550116014]);

  var color = d3.scaleThreshold()
    .domain([500, 1000, 1500, 2000, 2500])
    .range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

  var features = topojson.feature(us, us.objects.cb_2017_36_bg_500k).features;

  var g = svg.append("g");

  g.attr("class", "blkgroup")
    .selectAll("path")
      .data(features)
    .enter().append("path")
      .attr("d", geoPath)
      .filter(function(d) { return d.geometry != null && d.geometry.coordinates instanceof Array; })
      .attr("centerCoord", function(d) {return math.mean(d.geometry.coordinates)})
      .text(function(d) { return d; })
      .on('click', function(d) {
        if (selectWorkLoc==true) {
          // console.log('click');
          // console.log(features)
          console.log(d.geometry.coordinates);
          console.log(math.mean(d.geometry.coordinates,1));
          // console.log(geoPath.centroid(d));
          var t = geoPath.centroid(d)
          t = [Math.round(t[0]),Math.round(t[1])]

          d.properties.centerCoord = 
          svg.selectAll(".centroid").data([t])
            .enter().append("circle")
              .attr("class", "centroid")
              .attr("id", "workloc")
              .attr("fill", fill)
              .attr("stroke", stroke)
              .attr("stroke-width", strokeWidth)
              .attr("r", radius)
              .attr("cx", function (t){ return t[0]; })
              .attr("cy", function (t){ return t[1]; })
              .attr("transform", function(t) {return "translate("+t[0]+" px, "+t[1]+" px)";});
          selectWorkLoc=false;
        }
      })
      .style("fill", function(d) {return color(rentByGeoid[parseFloat(d.properties.GEOID)])})
      .style("stroke", "black");

  var centroids = features.map(function (feature){
    return geoPath.centroid(feature);
  });

  // var radians = d3.geo.distance([p1.Longitude, p1.Latitude], [p2.Longitude, p2.Latitude]);
  // var numberMiles = radians * 3959; // radius of earth

  // console.log(centroids);

  // g.selectAll(".centroid").data(centroids)
  //   .enter().append("circle")
  //     .attr("class", "centroid")
  //     .attr("fill", fill)
  //     .attr("stroke", stroke)
  //     .attr("stroke-width", strokeWidth)
  //     .attr("r", radius)
  //     .attr("cx", function (d){ return d[0]; })
  //     .attr("cy", function (d){ return d[1]; });
}



d3.select(self.frameElement).style("height", height + "px");