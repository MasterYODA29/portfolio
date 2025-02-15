import { fetchJSON, renderProjects } from '../global.js';
import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7.9.0/+esm";

const projects = await fetchJSON('../lib/projects.json');
const projectsContainer = document.querySelector('.projects');
let selectedIndex = -1;

async function loadProjects() {
    // const projectsContainer = document.querySelector('.projects');

    if (!projectsContainer) {
        console.error("Error: .projects container not found!");
        return;
    }

    const projects = await fetchJSON('../lib/projects.json');

    if (!projects || projects.length === 0) {
        console.error("Error: No project data found!");
        return;
    }

    renderProjects(projects, projectsContainer, 'h2'); // ✅ Ensures projects is correctly passed
    renderPieChart(projects);
}

function renderPieChart(projectsGiven) {
    // Constants from steps 5
    const svg = d3.select("#projects-pie-plot");
    console.log("SVG Node:", svg.node());
    const legendContainer = d3.select(".legend");

    d3.select("#projects-pie-plot").selectAll("path").remove();
    d3.select(".legend").selectAll("li").remove();

    let rolledData = d3.rollups(
        projectsGiven, // Use the given projects (filtered or full)
        (v) => v.length,
        (d) => d.year
    );

    let data = rolledData.map(([year, count]) => ({ value: count, label: year }));

    // Clear the existing pie chart and legend
    // Generate pie chart arcs
    let sliceGenerator = d3.pie().value((d) => d.value);
    let arcData = sliceGenerator(data);
    let arcGenerator = d3.arc().innerRadius(0).outerRadius(50);
    let colors = d3.scaleOrdinal(d3.schemeTableau10);

    // Create the pie chart
    arcData.forEach((arc, idx) => {
        d3.select("#projects-pie-plot")
            .append("path")
            .attr("d", arcGenerator(arc))
            .attr("fill", colors(idx))
            .attr("transform", "translate(50, 50)"); // Center the chart
    });

    svg.selectAll("path").each(function () {
        console.log("Path bound event:", d3.select(this).on("click"));
    });

    // Create the legend
    let legend = d3.select('.legend');
    data.forEach((d, idx) => {
        legend.append('li')
            .attr('style', `--color:${colors(idx)}`)
            .html(`<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`);
    });

    // UNCOMMENT IF BREAKS
    // const paths = svg.selectAll("path").data(arcData, d => d.data.label || d.data);
        const paths = svg.selectAll("path").data(arcData)

        // PATH 3rd ATTEMPt
        svg.selectAll("path")
        .data(arcData)
        .enter()
        .append("path")
        .attr("d", arcGenerator)
        .attr("fill", (d, idx) => colors(idx))
        .attr("transform", "translate(50, 50)")
        .classed("selected", (_, idx) => idx === selectedIndex) // Add selected class if already selected
        .on("mouseover", function () {
            d3.select(this).style("opacity", 0.5); // Highlight on hover
        })
        .on("mouseout", function () {
            d3.select(this).style("opacity", 1); // Reset on mouseout
        })
        
            svg.selectAll("path").on("click", function (_, d) {
                console.log("Path clicked:", d);
                const idx = arcData.indexOf(d); // Get index of clicked wedge
            console.log("Index of clicked wedge:", idx);
            selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selected index

            // Update selected class for all paths
            svg.selectAll("path").classed("selected", (arc, i) => i === selectedIndex);

            // Filter projects based on the selected wedge
            const filteredProjects = selectedIndex === -1
                ? projects
                : projects.filter(project => project.year === data[selectedIndex].label);

            console.log("Filtered Projects:", filteredProjects);
            renderProjects(filteredProjects, projectsContainer, 'h2'); // Update displayed projects
            });
        

    console.log("Event listeners bound to paths:", svg.selectAll("path").on("click"));
    // Add legend items
    legendContainer.selectAll("li")
        .data(data)
        .enter()
        .append("li")
        .attr("style", (d, idx) => `--color:${colors(idx)}`)
        .classed("selected", (_, idx) => idx === selectedIndex) // Add selected class if already selected
        .html(d => `<span class="swatch"></span> ${d.label} <em>(${d.value})</em>`)
        .on("click", (_, d) => {
            const idx = data.indexOf(d); // Get index of clicked legend item
            selectedIndex = selectedIndex === idx ? -1 : idx; // Toggle selected index

            // Update selected class for pie slices
            svg.selectAll("path").classed("selected", (arc, i) => i === selectedIndex);

            // Update selected class for legend items
            legendContainer.selectAll("li").classed("selected", (_, i) => i === selectedIndex);

            // Filter projects based on the selected legend item
            const filteredProjects = selectedIndex === -1
                ? projects
                : projects.filter(project => project.year === data[selectedIndex].label);

            renderProjects(filteredProjects, projectsContainer, 'h2'); // Update displayed projects
        });
}

let query = '';
let searchInput = document.querySelector('.searchBar');

// EVENT LISTENER FOR SEARCH INPUT 
searchInput.addEventListener('input', (event) => {
    query = event.target.value.toLowerCase();
    console.log("Search query:", query);
    const filteredProjects = projects.filter(project => {

        const values = Object.values(project).join(' ').toLowerCase(); // Combine all metadata fields
        return values.includes(query);
});
    console.log("Filtered Projects:", filteredProjects);
    renderProjects(filteredProjects, projectsContainer);
    renderPieChart(filteredProjects);
});

renderProjects(projects, projectsContainer, 'h2');

// Run function only after the DOM is ready
document.addEventListener("DOMContentLoaded", loadProjects);

