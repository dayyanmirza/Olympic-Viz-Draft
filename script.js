// Olympic Bump Chart Visualisation w/ D3.js

// Resources:
// Adapted from: https://observablehq.com/@analyzer2004/bump-chart
// Original author: Eric Lo
// Inspired by: https://github.com/johnwalley/d3-bumps-chart
// and https://roadtolarissa.com/stacked-bump/
// Adapted and customised by Dayyan Mirza


// set up dimensions and margins
const margin = { top: 60, right: 150, bottom: 60, left: 80 },
      initialWidth = 960,
      initialHeight = 600,
      width = initialWidth - margin.left - margin.right,
      height = initialHeight - margin.top - margin.bottom;

// create a responsive SVG using viewBox and preserveAspectRatio
const svg = d3.select("#chart")
  .append("svg")
    .attr("viewBox", `0 0 ${initialWidth} ${initialHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
  .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// global variables for interactivity and data storage
let x, y, colour, tooltip, lineGroup, circleGroup, legendGroup;
let allCountries = [], filteredCountries = [];

// load data from the preprocessed csv 
d3.csv("bump_data_decade.csv").then(data => {
  // Convert numeric fields
  data.forEach(d => {
    d.Year = +d.Year;
    d.Rank = +d.Rank;
    // 'total points' is assumed to be in the csv already
  });

  // get the unique years (e.g., 2012, 2016, 2020)
  const years = [...new Set(data.map(d => d.Year))]; 

  // calculates average rank per country (to pick the top 10 overall)
  const avgByCountry = d3.rollup(
    data,
    v => d3.mean(v, d => d.Rank),
    d => d.Country
  );
  const sortedCountries = Array.from(avgByCountry, ([Country, AvgRank]) => ({ Country, AvgRank }))
    .sort((a, b) => d3.ascending(a.AvgRank, b.AvgRank));
  const top10 = sortedCountries.slice(0, 10).map(d => d.Country);

  // filters the data to only include these top 10
  data = data.filter(d => top10.includes(d.Country));

  allCountries = Array.from(new Set(data.map(d => d.Country)));
  filteredCountries = allCountries.slice(); // start with all active

  // sets up the scales
  x = d3.scalePoint()
    .domain(years)
    .range([0, width])
    .padding(1);

  y = d3.scaleLinear()
    .domain([d3.max(data, d => d.Rank), 1])  // rank no. 1 is the highest
    .range([height, 0]);
    
  colour = d3.scaleOrdinal()
    .domain(allCountries)
    .range(d3.schemeTableau10.concat(d3.schemeSet3)); // colours chosen from here -> https://d3js.org/d3-scale-chromatic/categorical 
    
  // set up tooltip 
  tooltip = d3.select("#tooltip");

  // nest data by country 
  const grouped = d3.group(data, d => d.Country);
  
  // adds the horizontal gridlines for readability
  svg.append("g")
    .attr("class", "grid")
    .call(d3.axisLeft(y)
      .tickSize(-width)
      .tickFormat("")
    )
    .selectAll("line")
      .attr("stroke", "#ddd")
      .attr("stroke-dasharray", "1.5, 1.5");

  // draws the axes 
  svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x).tickFormat(d3.format("d")));

  svg.append("g")
    .call(d3.axisLeft(y).tickFormat(d3.format("d")));
    
  // this fixes the line at top so that it's lighter
  svg.selectAll("path.domain")
    .attr("stroke", "#ddd")
    .attr("stroke-dasharray", "1.5, 1.5")
    .attr("stroke-width", 1);
    
  // the axis labels
  svg.append("text")
    .attr("x", width / 2)
    .attr("y", height + 40)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Olympic Year");

  svg.append("text")
    .attr("transform", "rotate(-90)")
    .attr("y", -50)
    .attr("x", -height / 2)
    .style("text-anchor", "middle")
    .style("font-weight", "bold")
    .text("Rank (1 = Highest)");

  // creates groups for the lines and circles 
  lineGroup = svg.append("g").attr("class", "line-group");
  circleGroup = svg.append("g").attr("class", "circle-group");
  drawLinesAndCircles(grouped); // draws lines and circles initially

  // then draw an interactive legend
  legendGroup = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(${width + 20}, 0)`);
  drawLegend();

  // the dropdown for selecting a country
  const select = d3.select("#countrySelect");
  select.selectAll("option.country-option")
    .data(["", ...allCountries])
    .enter()
    .append("option")
      .attr("class", "country-option")
      .attr("value", d => d)
      .text(d => d === "" ? "-- Select a country to highlight --" : d);
  // when a country is selected, highlight it
  select.on("change", (event) => {
    const selected = event.target.value;
    highlightSelectedCountry(selected);
  });
}); 


// helper functions below:

// draw lines and circles based on current filteredCountries
function drawLinesAndCircles(grouped) {
  lineGroup.selectAll("*").remove(); 
  circleGroup.selectAll("*").remove();

  // group for each country
  grouped.forEach((values, country) => {
    if (!filteredCountries.includes(country)) return;

    // draws the line
    lineGroup.append("path")
      .datum(values)
      .attr("class", "country-line")
      .attr("data-country", country)
      .attr("fill", "none")
      .attr("stroke", colour(country))
      .attr("stroke-width", 2)
      .attr("d", d3.line()
        .x(d => x(d.Year))
        .y(d => y(d.Rank))
      );
      
    // draws the circles w/ tooltips
    circleGroup.selectAll(".dot-" + country)
      .data(values)
      .enter()
      .append("circle")
        .attr("class", "country-circle")
        .attr("data-country", country)
        .attr("cx", d => x(d.Year))
        .attr("cy", d => y(d.Rank))
        .attr("r", 4)
        .attr("fill", colour(country))
        .on("mouseover", (event, d) => {
          tooltip.transition().duration(200).style("opacity", 1);
          tooltip.html(`<strong>${d.Country}</strong><br>Year: ${d.Year}<br>Rank: ${d.Rank}<br>TotalPoints: ${d.TotalPoints}`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
          tooltip.transition().duration(300).style("opacity", 0);
        });

    // This adds the text label for the last point
    const latest = values[values.length - 1];
    lineGroup.append("text")
      .attr("x", x(latest.Year) + 6)
      .attr("y", y(latest.Rank))
      .attr("alignment-baseline", "middle")
      .style("font-size", "12px")
      .style("fill", colour(country))
      .text(country);
  });
}

// this draws the legend
function drawLegend() {
  legendGroup.selectAll("*").remove();

  const legendItems = legendGroup.selectAll(".legend-item")
    .data(allCountries)
    .enter()
    .append("g")
      .attr("class", "legend-item")
      .attr("transform", (d, i) => `translate(0, ${i * 20})`);

  // This adds rectangles for the legend items
  legendItems.append("rect")
    .attr("x", -15)
    .attr("y", -10)
    .attr("width", 10)
    .attr("height", 10)
    .attr("fill", d => colour(d))
    .style("cursor", "pointer")
    .style("opacity", d => filteredCountries.includes(d) ? 1 : 0.2)
    .style("stroke", d => filteredCountries.includes(d) ? "black" : "none")
    .style("stroke-width", d => filteredCountries.includes(d) ? 2 : 0)
    .on("click", (event, d) => {
      toggleCountry(d);
    });
  // This adds text labels for the legend items
  legendItems.append("text")
    .attr("x", 0)
    .attr("y", 0)
    .attr("dy", "0.32em")
    .style("cursor", "pointer")
    .text(d => d)
    .on("click", (event, d) => {
      toggleCountry(d);
    });
}

// this toggles the country in the legend
function toggleCountry(country) {
  if (filteredCountries.includes(country)) {
    filteredCountries = filteredCountries.filter(c => c !== country);
  } else {
    filteredCountries.push(country);
  }
  // then redraw lines and circles based on the filtered countries
  d3.csv("bump_data_decade.csv").then(data => {
    data.forEach(d => {
      d.Year = +d.Year;
      d.Rank = +d.Rank;
    });
    // filter the data again
    const newData = data.filter(d => filteredCountries.includes(d.Country));
    const newGrouped = d3.group(newData, d => d.Country);
    drawLinesAndCircles(newGrouped);
  });
  // redraws the legend
  drawLegend();
}

// this highlights the selected country
function highlightSelectedCountry(selectedCountry) {
  if (!selectedCountry) {
    // if no country is selected, then shows all
    lineGroup.selectAll(".country-line")
      .transition().duration(300)
      .style("opacity", 1);
    circleGroup.selectAll(".country-circle")
      .transition().duration(300)
      .style("opacity", 1);
  } else {
    // if a country is selected, then highlights it
    lineGroup.selectAll(".country-line")
      .transition().duration(300)
      .style("opacity", function(d) {
        return (d3.select(this).attr("data-country") === selectedCountry ? 1 : 0.2); // will be the current DOM element 
      });
    circleGroup.selectAll(".country-circle")
      .transition().duration(300)
      .style("opacity", function(d) {
        return (d.Country === selectedCountry ? 1 : 0.2);
      });
  }
}
