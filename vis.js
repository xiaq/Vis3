function id(x) { return x; }
function attrgetter(attr) { return function(d) { return d[attr]; }; }
function numcmp(a, b) { return a - b; }

var algorithmColor = {
  "Greedy Theta": "brown", "Greedy": "blue",
  "Theta": "purple", "Yao": "green", "WSPD": "red"
};

var algorithms = d3.keys(algorithmColor);

var inFields = {
  'nvertices': '#Vertices', 't': 'Required dilation',
  // 'algorithm': 'Algorithm',
}

var inValues = {"nvertices": d3.set(), 't': d3.set()};

function otherInField(f) {
  return f == 't' ? 'nvertices' : 't';
}

var outFields = {
  'nedges': '#Edges', 'weight': 'Weight', 
  'treal': 'Actual dilation',
  'maxDegree': 'Max degree',
  // 'diameter': 'Diameter', 'nintersections': '#Intersections',
  'runningTime': 'Running time'
};

var allFields = {};
d3.keys(inFields).forEach(function(f) { allFields[f] = inFields[f]; });
d3.keys(outFields).forEach(function(f) { allFields[f] = outFields[f]; });

var dispatch = d3.dispatch(
    'load',
    'xswitch', 'xfilter', 'yswitch', 'sxswitch',
    'algchange', 'algmouseover', 'algmouseout');

var theWholeData, theData, theAlgData;
var theXField = 'nvertices', theSXField = 'nedges', theYField = 'nedges';
var theOtherIn = 't', theOtherInValue;
var theAlgorithms = d3.set();

function updateTheData() {
  theData = theWholeData.filter(function(d) { return d[theOtherIn] == theOtherInValue });
  updateTheAlgData();
}

function updateTheAlgData() {
  if (theAlgorithms.empty() || theAlgorithms.size() == algorithms.length) {
    theAlgData = theData;
  } else {
    theAlgData = theData.filter(function(d) {
      return theAlgorithms.has(d.algorithm);
    });
  }
}

d3.csv("data.csv", function(error, data) {
  data.forEach(function(d) {
    d3.keys(allFields).forEach(function(k) { d[k] = +d[k]; });
    inValues.t.add(d.t);
    inValues.nvertices.add(d.nvertices);
  });
  theWholeData = data;
  inValues.t = inValues.t.values().sort(numcmp);
  inValues.nvertices = inValues.nvertices.values().sort(numcmp);
  theOtherInValue = inValues[theOtherIn][0];
  updateTheData();
  updateTheAlgData();
  dispatch.load();
});

var $tooltip = d3.select('body').append('div').attr('class', 'tooltip').style('opacity', 0);
var tooltipDuration = 200, tooltipOpacity = 0.9;
var tooltipXOff = 5, tooltipYOff = -28;

function showTooltip(html) {
  $tooltip.transition()
      .duration(tooltipDuration)
      .style('opacity', tooltipOpacity);
  $tooltip.html(html)
      .style('left', d3.event.pageX + tooltipXOff + 'px')
      .style('top', d3.event.pageY + tooltipYOff + 'px')
}

function hideTooltip() {
  $tooltip.transition()
      .duration(tooltipDuration)
      .style('opacity', 0);
}

function fieldfmt(d, f) {
  return allFields[f] + ' = ' + d[f];
}

function fieldsfmt(d, x, y, x2) {
  var html = '<b>' + d.algorithm + '</b><br/>' +
    fieldfmt(d, x) + '<br/>' + fieldfmt(d, y);
  if (x2 != x && x2 != y) {
    html += '<br/>(' + fieldfmt(d, x2) + ')';
  }
  return html;
}

function second(n) {
  return Math.round(n) + 's';
}

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

  var algs;

  var gs = svg.selectAll('g')
      .data(algorithms)
    .enter().append('g')
      .attr('transform', trans)
      .on('click', function(d) {
        if (theAlgorithms.has(d)) {
          d3.select(this).select('rect').attr('fill', 'white');
          theAlgorithms.remove(d);
        } else {
          d3.select(this).select('rect').attr('fill', 'black');
          theAlgorithms.add(d);
        }
        updateTheAlgData();
        dispatch.algchange();
      })
      .on('mouseover', dispatch.algmouseover)
      .on('mouseout', dispatch.algmouseout);

  gs.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('y', -9)
      .attr('x', -12)
      .attr('fill', 'white')
      .attr('stroke', 'black')
      .attr('stroke-width', '1px');

  gs.append('text').text(id);

  gs.append('line')
    .attr('stroke-width', lineWidth)
    .attr('stroke', function(d) { return algorithmColor[d]; })
    .attr('fill', 'none')
    .attr('x1', 0)
    .attr('y1', lineMargin)
    .attr('x2', lineLength)
    .attr('y2', lineMargin);

  function updateDisabled() {
    algs = d3.set();
    theData.forEach(function(d) {
      algs.add(d.algorithm);
    });
    gs.style('opacity', function(d) {
      return algs.has(d) ? '1' : '0.2';
    });
  }

  dispatch.on('load.legend', updateDisabled);
  dispatch.on('xswitch.legend', updateDisabled);
  dispatch.on('xfilter.legend', updateDisabled);
})();

// y switcher
(function() {
  d3.select('#y-switcher').append('select').on('change', function() {
      var v = this.value; theYField = v; dispatch.yswitch(v); })
    .selectAll('option').data(d3.keys(outFields)).enter().append('option')
    .attr('value', id).text(function (d) { return outFields[d]; });
})();

// x switcher
(function() {
  function update() {
    var xname = otherInField(theXField);
    d3.select('#x-switcher').selectAll('div').remove();
    var switcher = d3.select('#x-switcher').append('div');

    switcher.append('span').text('(filter: ' + inFields[xname] + ' =');
    var data = theWholeData;
    var options = d3.set(data.map(attrgetter(xname))).values().sort(numcmp);
    switcher.append('select').on('change', function() {
        var v = this.value; theOtherInValue = v; updateTheData();
        dispatch.xfilter(v); })
      .selectAll('option').data(options).enter().append('option')
      .attr('value', id).text(id);
    switcher.append('span').text(')');

    switcher.append('button').text('⇔').on('click', function() {
      theXField = xname;
      theOtherIn = otherInField(xname);
      theOtherInValue = inValues[theOtherIn][0];
      updateTheData();
      dispatch.xswitch(xname);
    });
    switcher.append('span').text(inFields[theXField]);
  }

  dispatch.on('load.xswitcher', update);
  dispatch.on('xswitch.xswitcher', update);
})();

// sx switcher
(function() {
  d3.select('#sx-switcher')
    .append('select')
      .on('change', function() {
        theSXField = this.value;
        dispatch.sxswitch();
      })
    .selectAll('option').data(d3.keys(outFields)).enter().append('option')
      .attr('value', id)
      .text(function(d) { return outFields[d]; });
})();

// Line chart
(function() {
  var margin = {top: 20, right: 10, bottom: 20, left: 70},
      width = 520 - margin.left - margin.right,
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

  var svg = d3.select("#line-chart").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var $x, $xLabel, $y, $yLabel, $paths = {};

  $x = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");
  /*$xLabel = $x.append('text')
      .attr('x', width)
      .attr('dy', '-1em')
      .attr('dx', '-0.2em')
      .style('text-anchor', 'end');*/
  $y = svg.append("g")
      .attr("class", "y axis");
  $yLabel = $y.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");

  algorithms.forEach(function(alg) {
    $paths[alg] = svg.append("path")
        .attr("class", "line")
        .attr('style', 'stroke: ' + algorithmColor[alg]);
  });

  dispatch.on('load.linechart', update);
  dispatch.on('xfilter.linechart', update);
  dispatch.on('xswitch.linechart', update);
  dispatch.on('yswitch.linechart', update);
  dispatch.on('algchange.linechart', update);

  dispatch.on('algmouseover.linechart', function(d) {
    $paths[d].classed('emphasized', true);
  });

  dispatch.on('algmouseout.linechart', function(d) {
    $paths[d].classed('emphasized', false);
  });

  var firstDraw = true, drawDuration = 500;

  function update() {
    x.domain(d3.extent(theAlgData, attrgetter(theXField)));
    y.domain(d3.extent(theAlgData, attrgetter(theYField)));

    var data = theData;
    $x.call(xAxis);
    $y.call(yAxis);

    //$xLabel.text(inFields[theXField]);
    $yLabel.text(outFields[theYField]);

    svg.selectAll('.dot').remove();

    algorithms.forEach(function(alg) {
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
        .style('fill', function (d) { return algorithmColor[d.algorithm]; })
        .on('mouseover', function(d) {
          showTooltip(fieldsfmt(d, theXField, theYField, theSXField));
        })
        .on('mouseout', hideTooltip);
    }, firstDraw ? 0 : drawDuration);
    firstDraw = false;
  }
})();

// Scatter plot
(function() {
  var margin = {top: 20, right: 20, bottom: 20, left: 70},
      width = 420 - margin.left - margin.right,
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

  var svg = d3.select("#scatter-plot").append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var $x, $xLabel, $y, $yLabel;
  $x = svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");
  /*$xLabel = $x.append('text')
      .attr('x', width)
      .attr('dy', '-1em')
      .attr('dx', '-0.2em')
      .style('text-anchor', 'end');*/
  $y = svg.append("g")
      .attr("class", "y axis");
  $yLabel = $y.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end");

  function update() {
    x.domain(d3.extent(theAlgData, attrgetter(theSXField)));
    y.domain(d3.extent(theAlgData, attrgetter(theYField)));

    $x.call(xAxis);
    $y.call(yAxis);
    //$xLabel.text(outFields[theSXField]);
    $yLabel.text(outFields[theYField]);

    svg.selectAll('.dot').remove();

    svg.selectAll('.dot').data(theData)
      .enter().append('circle')
        .attr('class', 'dot').attr('r', 2)
        .attr('cx', function(d) { return x(d[theSXField]); })
        .attr('cy', function(d) { return y(d[theYField]); })
        .style('fill', function (d) { return algorithmColor[d.algorithm]; })
        .on('mouseover', function(d) {
          showTooltip(fieldsfmt(d, theSXField, theYField, theXField));
        })
        .on('mouseout', hideTooltip);
  }

  dispatch.on('load.scatterplot', update);
  dispatch.on('yswitch.scatterplot', update);
  dispatch.on('xswitch.scatterplot', update);
  dispatch.on('sxswitch.scatterplot', update);
  dispatch.on('xfilter.scatterplot', update);
  dispatch.on('algchange.scatterplot', update);
})();

// Pie chart
(function() {
  var width = 200,
      height = 200,
      radius = Math.min(width, height) / 2;

  var color = d3.scale.ordinal()
      .range(["#98abc5", "#8a89a6", "#7b6888", "#6b486b", "#a05d56", "#d0743c", "#ff8c00"]);

  var arc = d3.svg.arc()
      .outerRadius(radius - 10)
      .innerRadius(0);

  var pie = d3.layout.pie()
      .sort(null)
      .value(attrgetter('runningTime'));

  var svg = d3.select("#pie-chart").append("svg")
      .attr("width", width)
      .attr("height", height)
    .append("g")
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")");

  function update() {
    var data = theData;
    var algs = theAlgorithms.empty() ? algorithms : theAlgorithms.values();
    var ttotal = 0;
    var pieData = algs.map(function(alg) {
      var t = 0;
      data.forEach(function(d) {
        if (d.algorithm == alg) {
          t += d.runningTime;
          ttotal += d.runningTime;
        }
      });
      return {"algorithm": alg, "runningTime": t, "color": algorithmColor[alg]};
    });

    d3.select('#total-time').text(second(ttotal));

    svg.selectAll('.arc').remove();

    var g = svg.selectAll('.arc')
        .data(pie(pieData))
      .enter().append('g')
        .attr('class', 'arc');

    g.append('path')
        .attr('d', arc)
        .style('fill', function(d) { return d.data.color; });
    g.append('text')
        .attr('transform', function(d) { return 'translate(' + arc.centroid(d) + ')'; })
        .attr('dy', '.35em')
        .style('text-anchor', 'middle')
        .text(function(d) {
          return d.endAngle - d.startAngle > 0.5 ? second(d.value) : '';
        });
  }

  dispatch.on('load.piechart', update);
  dispatch.on('xswitch.piechart', update);
  dispatch.on('xfilter.piechart', update);
  dispatch.on('algchange.piechart', update);
})();

// vi: se sw=2 ts=2 sts=2:
