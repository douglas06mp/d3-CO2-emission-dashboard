d3.queue()
  //GET DATA
  .defer(d3.json, '//unpkg.com/world-atlas@1.1.4/world/50m.json')
  .defer(d3.csv, './data/all_data.csv', function (row) {
    //FORMAT CSV DATA
    return {
      continent: row.Continent,
      country: row.Country,
      countryCode: row['Country Code'],
      emissions: +row['Emissions'],
      emissionsPerCapita: +row['Emissions Per Capita'],
      region: row.Region,
      year: +row.Year,
    };
  })
  .await(function (error, mapData, data) {
    if (error) throw error;

    //SETUP
    let extremeYears = d3.extent(data, (d) => d.year);
    let currentYear = extremeYears[0];
    let currentDataType = d3
      .select('input[name="data-type"]:checked')
      .attr('value');

    const geoData = topojson.feature(mapData, mapData.objects.countries)
      .features;

    const width = +d3.select('.chart-container').node().offsetWidth;
    const height = 300;

    //INIT DISPLAY
    createMap(width, (width * 4) / 5);
    drawMap(geoData, data, currentYear, currentDataType);

    createPie(width, height);
    drawPie(data, currentYear);

    createBar(width, height);
    drawBar(data, currentDataType, '');

    //UPDATE CHART WHEN INPUT CHANGE
    //RANGE INPUT FOR YEAR
    d3.select('#year')
      .attr('min', currentYear)
      .attr('max', extremeYears[1])
      .attr('value', currentYear)
      .on('input', () => {
        currentYear = +d3.event.target.value;
        drawMap(geoData, data, currentYear, currentDataType);
        drawPie(data, currentYear);
        highlightBars(currentYear);
      });
    //RADIO INPUT FOR DATA TYPE
    d3.selectAll('input[name="data-type"]').on('change', () => {
      let active = d3.select('.active').data()[0];
      let country = active ? active.properties.country : '';
      currentDataType = d3.event.target.value;

      drawMap(geoData, data, currentYear, currentDataType);
      drawBar(data, currentDataType, country);
    });

    //TOOLTIP
    d3.selectAll('svg').on('mousemove touchmove', updateTooltip);

    function updateTooltip() {
      const tooltip = d3.select('.tooltip');
      const dataType = d3.select('input:checked').property('value');

      //CHECK WHICH CHART
      let target = d3.select(d3.event.target);
      let isCountry = target.classed('country');
      let isArc = target.classed('arc');
      let isBar = target.classed('bar');

      //GET DATA BASED ON CHART
      let unit =
        dataType === 'emissions'
          ? 'thousand metric tons'
          : 'metric tons per capita';

      let data;
      let percentage = ''; //FOR PIE CHART ONLY
      if (isCountry) data = target.data()[0].properties;
      if (isBar) data = target.data()[0];
      if (isArc) {
        data = target.data()[0].data;
        percentage = `<p>Percentage of Total: ${getPercentage(
          target.data()[0]
        )}</p>`;
      }

      //POSITION
      tooltip
        .style('opacity', +(isCountry || isArc || isBar))
        .style('left', `${d3.event.pageX - tooltip.node().offsetWidth / 2}px`)
        .style('top', `${d3.event.pageY - tooltip.node().offsetHeight - 10}px`);

      //DISPLAY FORMATTED DATA
      if (data) {
        let dataValue = data[dataType]
          ? `${data[dataType].toLocaleString()} ${unit}`
          : 'Data Not Available';

        tooltip.html(`
            <p>Country: ${data.country}</p>
            <p>${formatDataType(dataType)}: ${dataValue}</p>
            <p>Year: ${data.year || d3.select('#year').property('value')}</p>
            ${percentage}
          `);
      }
    }
  });

//TOOLTIP FORMATTING FUNTION
function formatDataType(key) {
  return key[0].toUpperCase() + key.slice(1).replace(/[A-Z]/g, (c) => ' ' + c);
}

function getPercentage(d) {
  let angle = d.endAngle - d.startAngle;
  let fraction = (angle / (Math.PI * 2)) * 100;
  return `${fraction.toFixed(2)}%`;
}
