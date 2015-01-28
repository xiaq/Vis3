function id(x) { return x; }
function attrgetter(attr) { return function(d) { return d[attr]; }; }
function numcmp(a, b) { return a - b; }

var algorithms = {
  "Greedy Theta": "brown", "Greedy": "blue",
  "Theta": "purple", "Yao": "green", "WSPD": "red"
};

var inFields = {
  'nvertices': '#Vertices', 'algorithm': 'Algorithm', 't': 'Required dilation'
}

var inValues = {"nvertices": d3.set(), 't': d3.set()};

function otherInField(f) {
  return f == 't' ? 'nvertices' : 't';
}

var outFields = {
  'treal': 'Actual dilation',
  'nedges': '#Edges', 'weight': 'Weight', 
  'maxDegree': 'Max degree',
  'diameter': 'Diameter', 'nintersections': '#Intersections',
  'runningTime': 'Running time'
};

var dispatch = d3.dispatch(
    'load',
    'xswitch', 'xfilter',
    'algclick', 'algmouseover', 'algmouseout', 'algclear');

var theData, theXField = 'nvertices', theSXField = 'weight', theYField = 'nedges', theOtherIn = 't', theOtherInValue;

d3.csv("data.csv", function(error, data) {
  data.forEach(function(d) {
    d.t = +d.t;
    d.nvertices = +d.nvertices;
    d.nedges = +d.nedges;
    inValues.t.add(d.t);
    inValues.nvertices.add(d.nvertices);
  });
  theData = data;
  inValues.t = inValues.t.values().sort(numcmp);
  inValues.nvertices = inValues.nvertices.values().sort(numcmp);
  theOtherInValue = inValues[theOtherIn][0];
  dispatch.load(data);
});

// Legend
(function() {
  var margin = {top: 20, right: 10, bottom: 15, left: 25},
      width = 120 - margin.left - margin.right,
      height = 150 - margin.top - margin.bottom;

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
      .attr('transform', trans)
      .on('click', dispatch.algclick)
      .on('mouseover', dispatch.algmouseover)
      .on('mouseout', dispatch.algmouseout);

  gs.append('text').text(id);

  gs.append('line')
    .attr('stroke-width', lineWidth)
    .attr('stroke', function(d) { return algorithms[d]; })
    .attr('fill', 'none')
    .attr('x1', 0)
    .attr('y1', lineMargin)
    .attr('x2', lineLength)
    .attr('y2', lineMargin);

  var clear = svg.append('g')
    .attr('transform', trans)
    .on('click', dispatch.algclear)
    .append('text').text('(Clear)');
})();

// x switcher
(function() {
  function update() {
    var xname = otherInField(theXField);
    d3.select('#x-switcher').selectAll('div').remove();
    var switcher = d3.select('#x-switcher').append('div');
    switcher.append('span').text(inFields[theXField]);
    switcher.append('button').text('⇔').on('click', function() {
      theXField = xname;
      theOtherIn = otherInField(xname);
      theOtherInValue = inValues[theOtherIn][0];
      dispatch.xswitch(xname);
    });
    switcher.append('span').text(inFields[xname] + ' =');
    var options = d3.set(theData.map(attrgetter(xname))).values().sort(numcmp);
    switcher.append('select').on('change', function() {
        var v = this.value; theOtherInValue = v; dispatch.xfilter(v); })
      .selectAll('option').data(options).enter().append('option')
      .attr('value', id).text(id);
  }

  dispatch.on('load.xswitcher', update);
  dispatch.on('xswitch.xswitcher', update);
})();

// Line chart
(function() {
  var margin = {top: 20, right: 10, bottom: 20, left: 70},
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

  var line = d3.svg.line()
        .x(function(d) { return x(d[theXField]); })
        .y(function(d) { return y(d[theYField]); });

  var svg = d3.select("#line-chart").insert("svg", ':first-child')
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var $x, $xLabel, $y, $yLabel, $paths = {};

  dispatch.on('load.linechart', function(data) {
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
    update();
  });

  dispatch.on('xfilter.linechart', update);
  dispatch.on('xswitch.linechart', update)

  dispatch.on('algclick.linechart', function(alg) {
    var data = theData.filter(function(d) { return d[theOtherIn] == theOtherInValue });
    var algData = data.filter(function(d) { return d.algorithm == alg; });

    x.domain(d3.extent(algData, attrgetter(theXField)));
    y.domain(d3.extent(algData, attrgetter(theYField)));

    draw(data, 'nvertices', 'nedges')
  });

  dispatch.on('algmouseover.linechart', function(d) {
    $paths[d].classed('emphasized', true);
  });

  dispatch.on('algmouseout.linechart', function(d) {
    $paths[d].classed('emphasized', false);
  });

  dispatch.on('algclear.linechart', update);

  function update() {
    var data = theData.filter(function(d) { return d[theOtherIn] == theOtherInValue });

    x.domain(d3.extent(data, attrgetter(theXField)));
    y.domain(d3.extent(data, attrgetter(theYField)));

    draw(data);
  }

  var firstDraw = true, drawDuration = 500;

  function draw(data) {
    $x.call(xAxis);
    $y.call(yAxis);

    $xLabel.text(inFields[theXField]);
    $yLabel.text(outFields[theYField]);

    svg.selectAll('.dot').remove();

    d3.keys(algorithms).forEach(function(alg) {
      var datum = data.filter(function(d) { return d.algorithm == alg; });
      $paths[alg]
          .datum(datum)
          .transition()
          .duration(drawDuration)
          .attr('d', line);
    });

    setTimeout(function() {
      svg.selectAll('.dot').data(data)
        .enter().append('circle')
        .attr('class', 'dot').attr('r', 2)
        .attr('cx', function(d) { return x(d[theXField]); })
        .attr('cy', function(d) { return y(d[theYField]); })
        .style('fill', function (d) { return algorithms[d.algorithm]; });
    }, firstDraw ? 0 : drawDuration);
    firstDraw = false;
  }
})();

// vi: se sw=2 ts=2 sts=2:
