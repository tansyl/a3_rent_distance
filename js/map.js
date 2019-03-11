// placeholder of histogram chart


var width = 960,
    height = 700;
    radius = 6,
    fill = "rgba(255, 49, 255, 0.388)",
    stroke = "rgba(0, 0, 0, 0.5)",
    strokeWidth = 0.1;


// button of click to point office location
var selectWorkLoc = false;
document.getElementById('selectPt').onclick = function(){
  selectWorkLoc = true; console.log(selectWorkLoc);
  d3.selectAll('#workloc').remove();
};

// map generate from here

// define projection to NY
var albersProjection = d3.geoAlbers()
    .scale( 100000 )
    .rotate( [73.977,0] )
    .center( [0, 40.753] )
    .translate( [width/2,height/2] );

var geoPath = d3.geoPath()
    .projection( albersProjection );


// make a svg to hold the map
var svg = d3.select("#mapcontainer").append("svg")
    .attr("width", width)
    .attr("height", height);

// import data
d3.queue()
    .defer(d3.json, "data/ny.json")
    .defer(d3.csv, "data/Rent_2017_5yr.csv")
    .await(ready);

// start construct an array of objects that includes geoid, centerCoord_long, centerCoord_lat, distance_to_center, median_rent
var distanceRent = {}; 
var distanceRentList =[];

function ready(error, us, rent) {
  if (error) throw error;

  // create a dictionary mapping GEOID: Median Gross Rent



  var rentByGeoid = {}; // Create empty object for holding dataset
  rent.forEach(function(d) {
    var geoid = parseFloat(d['Geographic Identifier'].substr(7,));
    rentByGeoid[geoid] = + parseFloat(d['Median Gross Rent']);
    distanceRent[geoid] = {"geoid":geoid, "median_rent" : parseFloat(d['Median Gross Rent']), "centerCoord_long": 0 ,"centerCoord_lat": 0 ,"distance_to_center":-1};
  });

  


  // test loading
  console.log(rentByGeoid[360550116014]);

  // Define color scale

  var color = d3.scaleThreshold()
    .domain([500, 1000, 1500, 2000, 2500])
    .range(["#f2f0f7", "#dadaeb", "#bcbddc", "#9e9ac8", "#756bb1", "#54278f"]);

  // get features from map
  var features = topojson.feature(us, us.objects.cb_2017_36_bg_500k).features;

  var g = svg.append("g");

  g.attr("class", "blkgroup")
    .selectAll("path")
      .data(features)
    .enter().append("path")
      .attr("class", "blk")
      .attr("d", geoPath)
      .filter(function(d) { 
        // console.log(d.geometry.coordinates.length);
        // console.log(d.geometry.coordinates[0][0].length);
        // && d.geometry.coordinates instanceof Array && d.geometry.coordinates.length[0] > 3 && d.geometry.coordinates[0][0].length == 2;
        return d.geometry != null })
      .attr("centerCoord_long", function(d) {
        l = transpose(d.geometry.coordinates[0]); 
        distanceRent[parseFloat(d.properties.GEOID)]["centerCoord_long"] = math.mean(l[0]);
        return math.mean(l[0])
      })
      .attr("centerCoord_lat", function(d) {
        l = transpose(d.geometry.coordinates[0]); 
        distanceRent[parseFloat(d.properties.GEOID)]["centerCoord_lat"] = math.mean(l[1]);
        return math.mean(l[1])
      })
      .text(function(d) { return d; })
      .on('click', function(d) {
        if (selectWorkLoc==true) {
          // console.log('click');
          // console.log(features)
          // console.log(d.geometry.coordinates);
          // console.log(math.mean(d.geometry.coordinates,1));
          // console.log(geoPath.centroid(d));

          // get the center of the shape
          var t = geoPath.centroid(d)
          t = [Math.round(t[0]),Math.round(t[1])]

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

          var centroidCoord = [d3.select(this).attr("centerCoord_long"),d3.select(this).attr("centerCoord_lat")]

          // calculate the distance between this point and others
          // svg.selectAll(".blk").attr("distance", d3.select(this).attr("centerCoord_long"))
          d3.selectAll(".blk").each(function(d,i){
              var elt = d3.select(this);
              // console.log( elt.attr("centerCoord_long") - centroidCoord[0]);
              p1 = [elt.attr("centerCoord_long"),elt.attr("centerCoord_lat")];
              p2 = centroidCoord;
              distanceRent[parseFloat(d.properties.GEOID)]["distance_to_center"] = getDistance(p1,p2);
              elt.attr("distance",getDistance(p1,p2));
          });

          distanceRentList = Object.keys(distanceRent).map(function(key){return distanceRent[key];});

          console.log(distanceRent[360550116014]);
        }
      })
      .style("fill", function(d) {return color(rentByGeoid[parseFloat(d.properties.GEOID)])})
      .style("stroke", "black");

  distanceRentList = Object.keys(distanceRent).map(function(key){return distanceRent[key];});
  console.log(distanceRent[360550116014]);

  // get all centroids
  var centroids = features.map(function (feature){
    return geoPath.centroid(feature);
  });

}

// scatter plot code here
var scattersvg = d3.select("#scatterplot").append("svg")
    .attr("width", "100%")
    .attr("height", "100%")
    .data(distanceRentList)
    .enter()
    .append("p")
    .text(function (d,i) {return "i = " + i + " d = "+d.median_rent;});

var data = [30, 86, 168, 281, 303, 365];

// histogram plot code here
hist = d3.select("#histogram").select(".chart")
  .selectAll("div")
  .data(distanceRentList)
    .enter()
    .append("div")
    .style("height", function(d) { return d.median_rent/1000 + "px"; })

d3.select(self.frameElement).style("height", height + "px");

function findCenterCoord(l) {
  return math.mean([math.max(l,0), math.min(l,0)],0);
}
function transpose(a)
{
  return a[0].map(function (_, c) { return a.map(function (r) { return r[c]; }); });
}
// calculate real distance between two points

function getDistance(p1,p2){
    var radians = d3.geoDistance(p1,p2);
    return radians * 3959; // radius of earth
}