function createMap(width, height) {
  d3.select('#map')
    .attr('width', width)
    .attr('height', height)
    .append('text')
    .attr('x', width / 2)
    .attr('y', '1em')
    .attr('font-size', '1.5em')
    .style('text-anchor', 'middle')
    .classed('map-title', true);
}

function drawMap(geoData, climateData, year, dataType) {
  //SETUP
  const map = d3.select('#map');

  const projection = d3
    .geoMercator()
    .scale(110)
    .translate([+map.attr('width') / 2, +map.attr('height') / 1.4]);

  const path = d3.geoPath().projection(projection);

  //UPDATE TITLE TEXT
  d3.select('#year-val').text(year);

  //BIND CLIMATE DATA TO GEODATA
  geoData.forEach((d) => {
    let countries = climateData.filter((row) => row.countryCode === d.id);
    let name = '';

    if (countries.length > 0) name = countries[0].country;
    d.properties = countries.find((c) => c.year === year) || { country: name };
  });

  //COLOR SCALE
  const colorRange = ['#f1c40f', '#e67e22', '#e74c3c', '#c0392b'];

  const domain = {
    emissions: [0, 2.5e5, 1e6, 5e6],
    emissionsPerCapita: [0, 0.5, 2, 10],
  };

  const mapColorScale = d3
    .scaleLinear()
    .domain(domain[dataType])
    .range(colorRange);

  //UPDATE DATA AND TITLE
  let update = map.selectAll('.country').data(geoData);

  update
    .enter()
    .append('path')
    .classed('country', true)
    .attr('d', path)
    //DISPLAY BAR CHART
    .on('click', function () {
      let currentDataType = d3.select('input:checked').property('value');
      let country = d3.select(this);
      let isActive = country.classed('active');
      let countryName = isActive ? '' : country.data()[0].properties.country;

      drawBar(climateData, currentDataType, countryName);
      highlightBars(+d3.select('#year').property('value'));

      d3.selectAll('.country').classed('active', false);
      country.classed('active', !isActive);
    })
    //
    .merge(update)
    .transition()
    .duration(500)
    .attr('fill', (d) => {
      let val = d.properties[dataType];
      return val ? mapColorScale(val) : '#ccc';
    });

  d3.select('.map-title').text(
    `Carbon dioxide ${graphTitle(dataType)}, ${year}`
  );
}

function graphTitle(str) {
  return str.replace(/[A-Z]/g, (w) => ' ' + w.toLowerCase());
}
