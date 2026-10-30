import * as d3 from 'https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm';
import { fetchJSON, renderProjects } from '../global.js';

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');

// Step 1.6: show the project count in the page title
const projectsTitle = document.querySelector('.projects-title');
projectsTitle.textContent = `${projects.length} Projects`;

// Both filters live here, so each one keeps the other in place (Step 5.4 fix)
let query = '';
let selectedYear = null;

// Created once, so each year keeps the same color while filtering
const colors = d3.scaleOrdinal(d3.schemeTableau10);

function renderPieChart(projectsGiven) {
  const rolledData = d3.rollups(
    projectsGiven,
    (v) => v.length,
    (d) => d.year,
  );
  const data = rolledData.map(([year, count]) => ({ value: count, label: year }));

  const sliceGenerator = d3.pie().value((d) => d.value);
  const arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
  const arcs = sliceGenerator(data).map((d) => arcGenerator(d));

  const svg = d3.select('#projects-pie-plot');
  const legend = d3.select('.legend');
  svg.selectAll('path').remove();
  legend.selectAll('li').remove();

  const selectYear = (year) => {
    selectedYear = selectedYear === year ? null : year;
    update();
  };

  arcs.forEach((arc, i) => {
    svg
      .append('path')
      .attr('d', arc)
      .attr('fill', colors(data[i].label))
      .attr('class', data[i].label === selectedYear ? 'selected' : null)
      .on('click', () => selectYear(data[i].label));
  });

  data.forEach((d) => {
    legend
      .append('li')
      .attr('style', `--color:${colors(d.label)}`)
      .attr('class', d.label === selectedYear ? 'legend-item selected' : 'legend-item')
      .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
      .on('click', () => selectYear(d.label));
  });
}

function update() {
  // Search filter: match the query against all of a project's fields
  const searched = projects.filter((project) => {
    const values = Object.values(project).join('\n').toLowerCase();
    return values.includes(query.toLowerCase());
  });

  // A selected year that the search hid would leave an empty list, so drop it
  if (!searched.some((p) => p.year === selectedYear)) selectedYear = null;

  // The pie shows the searched projects; the list also applies the year
  renderPieChart(searched);
  const shown = selectedYear ? searched.filter((p) => p.year === selectedYear) : searched;
  renderProjects(shown, projectsContainer, 'h2');
}

update();

document.querySelector('.searchBar').addEventListener('input', (event) => {
  query = event.target.value;
  update();
});
