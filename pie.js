function createPie(width, height) {
  const pie = d3.select('#pie').attr('width', width).attr('height', height);

  pie
    .append('g')
    .attr(
      'transform',
      'translate(' + width / 2 + ', ' + (height / 2 + 10) + ')'
    )
    .classed('chart', true);

  pie
    .append('text')
    .attr('x', width / 2)
    .attr('y', '1em')
    .attr('font-size', '1.5em')
    .style('text-anchor', 'middle')
    .classed('pie-title', true);
}

function drawPie(data, currentYear) {
  //SETUP
  const pie = d3.select('#pie');

  const arcs = d3
    .pie()
    .sort((a, b) => {
      if (a.continent < b.continent) return -1;
      if (a.continent > b.continent) return 1;
      return a.emissions - b.emissions;
    })
    .value((d) => d.emissions);

  const path = d3
    .arc()
    .outerRadius(+pie.attr('height') / 2 - 50)
    .innerRadius(0);

  //COLORSCALE BY CONTINENT
  let yearData = data.filter((d) => d.year === currentYear);
  let continents = [];
  yearData.forEach((d) => {
    let continent = d.continent;
    if (!continents.includes(continent)) continents.push(continent);
  });

  const colorScale = d3
    .scaleOrdinal()
    .domain(continents)
    .range(['#ab47bc', '#7e57c2', '#26a69a', '#42a5f5', '#78909c']);

  //UPDATE
  let update = pie.select('.chart').selectAll('.arc').data(arcs(yearData));

  update.exit().remove();

  update
    .enter()
    .append('path')
    .classed('arc', true)
    .merge(update)
    .attr('stroke', '#dff1ff')
    .attr('stroke-width', '0.25px')
    .attr('fill', (d) => colorScale(d.data.continent))
    .attr('d', path);

  pie
    .select('.pie-title')
    .text(`Total emissions by continent and region, ${currentYear}`);
}
