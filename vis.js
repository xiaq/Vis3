var algorithms = {
  "Greedy Theta": "brown", "Greedy": "blue",
  "Theta": "purple", "Yao": "violet", "WSPD": "red"
};

var inFields = {
  'nvertices': '# Vertices', 'algorithm': 'Algorithm', 't': 'Required dilation'
}

function otherIn(f) {
  return f == 't' ? 'nvertices' : 't';
}

var outFields = {
  'treal': 'Actual dilation',
  'nedges': '# Edges', 'weight': 'Weight', 
  'maxDegree': 'Max degree',
  'diameter': 'Diameter', 'nintersections': '# Intersections',
  'runningTime': 'Running time'
};

var dispatch = d3.dispatch('load');
var theData;

d3.csv("data.csv", function(error, data) {
  data.forEach(function(d) {
    d.nvertices = +d.nvertices;
    d.nedges = +d.nedges;
  });
  theData = data;
  dispatch.load(data);
});

// Legend
(function() {
  var margin = {top: 20, right: 10, bottom: 15, left: 25},
      width = 200 - margin.left - margin.right,
      height = 200 - margin.top - margin.bottom;

  var svg = d3.select("#legend").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var gy = 0, gh = 22, lineMargin = 2, lineLength = 70, lineWidth = '1px';

  function trans() {
    var r = 'translate(0,' + gy + ')';
    gy += gh;
    return r;
  }

  var gs = svg.selectAll('g')
      .data(d3.keys(algorithms))
    .enter().append('g')
      .attr('transform', trans);
  gs.append('text')
    .text(function(d) { return d; });
  gs.append('line')
    .attr('stroke-width', lineWidth)
    .attr('stroke', function(d) { return algorithms[d]; })
    .attr('fill', 'none')
    .attr('x1', 0)
    .attr('y1', lineMargin)
    .attr('x2', lineLength)
    .attr('y2', lineMargin);
})();

// Line chart
(function() {
  var margin = {top: 20, right: 20, bottom: 30, left: 50},
      width = 640 - margin.left - margin.right,
      height = 420 - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .range([0, width]);

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  function line(xname, yname) {
      return d3.svg.line()
          .x(function(d) { return x(d[xname]); })
          .y(function(d) { return y(d[yname]); });
  }

  var svg = d3.select("#line-chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var $x, $xLabel, $y, $yLabel, $paths = {};

  dispatch.on('load', function(data) {
    $x = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")");
    $xLabel = $x.append('text')
        .attr('x', width)
        .attr('dy', '-1em')
        .attr('dx', '-0.2em')
        .style('text-anchor', 'end');

    $y = svg.append("g")
        .attr("class", "y axis");
    $yLabel = $y.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", ".71em")
        .style("text-anchor", "end");

    d3.keys(algorithms).forEach(function(alg) {
      $paths[alg] = svg.append("path")
          .attr("class", "line")
          .attr('style', 'stroke: ' + algorithms[alg]);
    });

    update('nvertices', 'nedges')
  });

  function update(xname, yname) {
    var data = theData.filter(function(d) { return d.t == 1.1 });

    x.domain(d3.extent(data, function(d) { return d[xname]; }));
    y.domain(d3.extent(data, function(d) { return d[yname]; }));

    $x.call(xAxis);
    $y.call(yAxis);

    $xLabel.text(inFields[xname]);
    $yLabel.text(outFields[yname]);

    d3.keys(algorithms).forEach(function(alg) {
      var datum = data.filter(function(d) { return d.algorithm == alg; });
      $paths[alg]
          .datum(datum)
          .transition()
          .duration(1000)
          .attr('d', line(xname, yname));
    });
  }
})();

// vi: se sw=2 ts=2 sts=2:
