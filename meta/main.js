const width = 1000;
const height = 600;
const margin = { top: 10, right: 10, bottom: 30, left: 50 };
//global variables
let xScale, yScale;

const usableArea = {
  top: margin.top,
  right: width - margin.right,
  bottom: height - margin.bottom,
  left: margin.left,
  width: width - margin.left - margin.right,
  height: height - margin.top - margin.bottom,
};

// Function to Display Stats
function displayStats() {
  const processedCommits = processCommits(data);
  const dl = d3.select('#stats').append('dl').attr('class', 'stats');

  dl.append('dt').html('Total <abbr title="Lines of Code">LOC</abbr>');
  dl.append('dd').text(data.length);

  dl.append('dt').text('Total commits');
  dl.append('dd').text(processedCommits.length);
}

// Function to Process Commits
function processCommits(data) {
  return d3.groups(data, (d) => d.commit).map(([commit, values]) => ({
    commit,
    datetime: new Date(values[0].datetime),
    hourFrac:
      new Date(values[0].datetime).getHours() +
      new Date(values[0].datetime).getMinutes() / 60,
      totalLines: values.reduce((sum, d) => sum + d.line, 0),
      lines: values.map((d) => ({ type: d.type, line: d.line })),
  }));
}

// Create brush step 5 

//Let brush know if commit is selected
let brushSelection = null;

function isCommitSelected(commit) {
  if (!brushSelection) return false;

  const [x0, y0] = brushSelection[0];
  const [x1, y1] = brushSelection[1];

  const x = xScale(commit.datetime);
  const y = yScale(commit.hourFrac);

  return x >= x0 && x <= x1 && y >= y0 && y <= y1;
}

function updateSelection() {
  d3.selectAll('circle').classed('selected', (d) => isCommitSelected(d));
}

function updateSelectionCount() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
  
    const countElement = document.getElementById('selection-count');
    countElement.textContent = `${
      selectedCommits.length || 'No'
    } commits selected`;
  
    return selectedCommits;
  }

function brushSelector() {
    const svg = document.querySelector('svg');
    
    // Create brush
  d3.select(svg)
  .call(
    d3.brush().on('start brush end', (event) => {
      brushSelection = event.selection; // Update the selection
      updateSelection(); // Log the brushing
      updateSelectionCount();
      updateLanguageBreakdown();
    })
  );

// Raise dots and other necessary elements after the brush overlay
d3.select(svg).selectAll('.dots, .overlay ~ *').raise();
  }

  function updateLanguageBreakdown() {
    const selectedCommits = brushSelection
      ? commits.filter(isCommitSelected)
      : [];
    const container = document.getElementById('language-breakdown');
  
    if (selectedCommits.length === 0) {
      container.innerHTML = '';
      return;
    }
    const requiredCommits = selectedCommits.length ? selectedCommits : commits;
    const lines = requiredCommits.flatMap((d) => d.lines);
  
    // Use d3.rollup to count lines per language
    const breakdown = d3.rollup(
      lines,
      (v) => v.length,
      (d) => d.type
    );
  
    // Update DOM with breakdown
    container.innerHTML = '';
  
    for (const [language, count] of breakdown) {
      const proportion = count / lines.length;
      const formatted = d3.format('.1~%')(proportion);
  
      container.innerHTML += `
              <dt>${language}</dt>
              <dd>${count} lines (${formatted})</dd>
          `;
    }
  
    return breakdown;
  }

// Function to Create Scatterplot
function createScatterplot(commits) {
  // Create SVG

//  STEP 4 
  const sortedCommits = d3.sort(commits, (d) => -d.totalLines);
  const [minLines, maxLines] = d3.extent(commits, (d) => d.totalLines);

  const rScale = d3
  .scaleSqrt() // Change only this line
  .domain([minLines, maxLines])
  .range([5, 50]);

  const svg = d3
    .select('#chart')
    .append('svg')
    .attr('viewBox', `0 0 ${width} ${height}`)
    .style('overflow', 'visible');

  // Define Scales
  xScale = d3
    .scaleTime()
    .domain(d3.extent(commits, (d) => d.datetime))
    .range([usableArea.left, usableArea.right])
    .nice();

  yScale = d3
    .scaleLinear()
    .domain([0, 24])
    .range([usableArea.bottom, usableArea.top]);

  // Add Axes
  const xAxis = d3.axisBottom(xScale).ticks(5).tickFormat(d3.timeFormat("%b %d, %H:%M"));
  svg
    .append('g')
    .attr('class', 'x-axis')
    .attr('transform', `translate(0, ${usableArea.bottom})`)
    .call(xAxis);

  const yAxis = d3.axisLeft(yScale).tickFormat((d) => `${String(d % 24).padStart(2, '0')}:00`);
  svg
    .append('g')
    .attr('class', 'y-axis')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(yAxis);

  // Add Horizontal Gridlines
  svg
    .append('g')
    .attr('class', 'gridlines')
    .attr('transform', `translate(${usableArea.left}, 0)`)
    .call(
      d3.axisLeft(yScale).tickFormat('').tickSize(-usableArea.width)
    );

  // Add Scatterplot Dots
  const dots=svg
    .append('g')
    .attr('class', 'dots')
    .selectAll('circle')
    .data(sortedCommits)
    // change back to commits if goes wrong
    .join('circle')
    .attr('cx', (d) => xScale(d.datetime))
    .attr('cy', (d) => yScale(d.hourFrac))
    .attr('r', (d) => {
        const radius = rScale(d.totalLines);
        console.log('Commit:', d.commit, 'Total Lines:', d.totalLines, 'Radius:', radius);
        return radius;
      })
    .style('fill-opacity', 0.7) // Add transparency
  .on('mouseenter', function (event, d) {
    d3.select(event.currentTarget).style('fill-opacity', 1); // Full opacity on hover
    updateTooltipContent(d);
    updateTooltipVisibility(true);
    updateTooltipPosition(event);
  })
  .on('mouseleave', function () {
    d3.select(event.currentTarget).style('fill-opacity', 0.7); // Restore transparency
    updateTooltipContent({});
    updateTooltipVisibility(false);
  });

  brushSelector();


    console.log('Dots created:', dots.nodes());
}


// STEP 3 
function updateTooltipContent(commit) {
    const link = document.getElementById('commit-link');
    const date = document.getElementById('commit-date');
  
    if (Object.keys(commit).length === 0) return;
  
    link.href = commit.url;
    link.textContent = commit.id;
    date.textContent = commit.datetime?.toLocaleString('en', {
      dateStyle: 'full',
    });
  }

  function updateTooltipVisibility(isVisible) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.hidden = !isVisible;
  }

  function updateTooltipPosition(event) {
    const tooltip = document.getElementById('commit-tooltip');
    tooltip.style.left = `${event.clientX}px`;
    tooltip.style.top = `${event.clientY}px`;
  }

// Load Data and Initialize Chart
let data;
let commits;
async function loadData() {
  data = await d3.csv('loc.csv', (row) => ({
    ...row,
    line: Number(row.line),
    depth: Number(row.depth),
    length: Number(row.length),
    date: new Date(row.date + 'T00:00' + row.timezone),
    datetime: new Date(row.datetime),
  }));

  commits = processCommits(data);
  console.log('Processed Commits:', commits);
  displayStats();
  createScatterplot(commits);
}

// Start the script when DOM is loaded
document.addEventListener('DOMContentLoaded', loadData);
