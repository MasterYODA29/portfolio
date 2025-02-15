let data = [];
let commits = d3.groups(data, (d) => d.commit);


const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 50 };

const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

// Function to Create Scatterplot
function createScatterplot() {
  // Create SVG
  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Scales
  const xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  const yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Add Horizontal Gridlines
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
    );

  svg
    .append('g')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  svg
    .append('g')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3
      .axisLeft(yScale)
      .tickFormat((d) => String(d % 24).padStart(2, '0') + ':00');

  // Scatterplot Dots
  const dots = svg.append('g').attr('class', 'dots');

  dots
  .selectAll('circle')
  .data(commits)
  .join('circle')
  .attr('cx', (d) => xScale(d.datetime))
  .attr('cy', (d) => yScale(d.hourFrac))
  .attr('r', 5)
  .attr('fill', 'steelblue');
}



async function loadData() {
    data = await d3.csv('loc.csv', (row) => ({
        ...row,
        line: Number(row.line), // or just +row.line
        depth: Number(row.depth),
        length: Number(row.length),
        date: new Date(row.date + 'T00:00' + row.timezone),
        datetime: new Date(row.datetime),
      }));


    commits = d3.groups(data, (d) => d.commit);
    displayStats();
    console.log(commits);
    console.log(data);
}

document.addEventListener('DOMContentLoaded', async () => {
  await loadData();
  createScatterplot();
});

//for processing commits and datetime
function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([commit, values]) => ({
    commit,
    datetime: new Date(values[0].datetime), // Use the first datetime in the group
    hourFrac:
      new Date(values[0].datetime).getHours() +
      new Date(values[0].datetime).getMinutes() / 60, // Time as fractional hour
  }));
}



function displayStats() {
    // Select the #stats div and create a <dl> element
    processCommits();
    const dl = d3.select('#stats').append('dl').attr('class', 'stats');

    // Add total lines of code (LOC)
    dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
    dl.append('dd').text(data.length);

    // Add total commits
    dl.append('dt').text('Total commits');
    dl.append('dd').text(commits.length);

    // Add more stats if needed (e.g., unique authors or specific summaries)
}

