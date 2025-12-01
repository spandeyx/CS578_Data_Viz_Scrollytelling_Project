// --- D3 Visualization and Scroll Handler Logic ---

// Global D3 variables for the Radial Bar Chart
let svg, height, width, chartGroup;
let outerRadius, innerRadius;

// Margin definition for the visualization
const margin = { top: 60, right: 60, bottom: 60, left: 60 };
let innerWidth, innerHeight;

let currentStory = 'balanced'; // Set balanced as default
let observer; // Global observer instance

// Get the graphic column element and story/button elements
const graphicCol = document.getElementById('graphic-col');
const balancedStoryDiv = document.getElementById('balanced-story');
const criticalStoryDiv = document.getElementById('critical-story');
const balancedBtn = document.getElementById('balanced-btn');
const criticalBtn = document.getElementById('critical-btn');

// --- DATA ---
// Normalized data (0.0 = Low Impact, 1.0 = High Impact)

// Data for the "For Favor" (Balanced View) - Not used for visualization
const balancedStepsData = [
    { evImpact: 0.3, iceImpact: 0.5, metric: "Environmental Trade-Offs (Low)" },
];

// Data for the "Against" (Critical View)
const criticalStepsData = [
    // Step 0-1: Not used for visualization
    { evImpact: 0.0, iceImpact: 0.0, metric: "" },
    { evImpact: 0.7, iceImpact: 0.4, metric: "Manufacturing (Metals/Toxics)" },
    // Step 2: Use Phase (Dirty Grid) - THE TARGET DATA POINT
    // EV Impact: 0.9 (Very High Impact due to dirty charging)
    // ICE Impact: 0.7 (High Impact from fuel combustion)
    { evImpact: 0.9, iceImpact: 0.7, metric: "Use Phase Emissions (Dirty Grid)" }, 
    // Step 3-4: Not used for visualization
    { evImpact: 0.8, iceImpact: 0.6, metric: "Resource Depletion/Recycling" },
    { evImpact: 0.75, iceImpact: 0.65, metric: "Net Lifecycle Impact" },
];

const TARGET_STEP_INDEX = 2; // The only step where visualization is shown

// Pre-process the data for the radial bar chart
const getRadialChartData = () => {
    // We only call this when currentStory is 'critical' and at TARGET_STEP_INDEX
    const data = criticalStepsData[TARGET_STEP_INDEX];
    
    // Normalize EV and ICE impact for visualization scale (0-100)
    // We'll use 1.0 as the max possible impact (100)
    return [
        { vehicle: 'EV on Dirty Grid', impactScore: data.evImpact, color: '#ef4444' }, // Red
        { vehicle: 'ICE Vehicle', impactScore: data.iceImpact, color: '#f97316' }, // Orange
    ];
};

// --- INITIALIZATION (Radial Chart Setup) ---
const initializeVisualization = () => {
    // 1. Clear previous content and set up SVG
    d3.select("#graphic").select("svg").remove();
    const graphicContainer = document.getElementById('graphic');
    
    if (!graphicContainer.clientWidth || !graphicContainer.clientHeight) return;
    
    width = graphicContainer.clientWidth;
    height = graphicContainer.clientHeight;
    
    // Calculate Radius
    const minDim = Math.min(width, height);
    outerRadius = (minDim / 2) - margin.top; // Max available radius
    innerRadius = outerRadius * 0.4; // Inner circle for text/center focus

    svg = d3.select("#graphic")
        .append("svg")
        .attr("width", width)
        .attr("height", height);

    // Center the chart group
    chartGroup = svg.append("g")
        .attr("transform", `translate(${width / 2}, ${height / 2})`);
};

// --- UPDATE VISUALIZATION ON SCROLL STEP (Radial Chart) ---
const updateVisualization = () => {
    
    if (currentStory !== 'critical') return; // Only update for critical view

    const data = getRadialChartData();
    const maxImpact = 1.0; // The theoretical max impact for normalization

    // 1. Scale for Bar Height (Radial Length)
    const yRadial = d3.scaleLinear()
        .domain([0, maxImpact]) 
        .range([innerRadius, outerRadius]);

    // 2. Scale for Angular Position (Band)
    const xRadial = d3.scaleBand()
        .domain(data.map(d => d.vehicle))
        .range([0, 2 * Math.PI]) // Full circle
        .align(0.5)
        .paddingInner(0.1)
        .paddingOuter(0.3);

    // 3. Arc Generator
    const arc = d3.arc()
        .innerRadius(innerRadius)
        .outerRadius(d => yRadial(d.impactScore))
        .startAngle(d => xRadial(d.vehicle))
        .endAngle(d => xRadial(d.vehicle) + xRadial.bandwidth())
        .cornerRadius(10); // Rounded ends for the bars

    // 4. Data Join (Radial Bars)
    const bars = chartGroup.selectAll(".radial-bar")
        .data(data, d => d.vehicle);

    // 5. Enter/Update Selection
    bars.enter().append("path")
        .attr("class", "radial-bar")
        .attr("fill", d => d.color)
        .attr("d", arc)
        .each(function(d) { this._current = { impactScore: innerRadius }; }) // Store initial state for smooth transition
        .merge(bars)
        .transition().duration(1500)
        .attrTween("d", function(d) {
            // Tween the impactScore from previous state to new state
            const interpolate = d3.interpolate(this._current.impactScore, d.impactScore);
            this._current.impactScore = d.impactScore;
            return function(t) {
                return arc({
                    vehicle: d.vehicle,
                    impactScore: interpolate(t) 
                });
            };
        });

    // 6. Labels (Text along the circumference)
    const labels = chartGroup.selectAll(".radial-label")
        .data(data, d => d.vehicle);

    // Calculate the midpoint angle for labeling
    const getLabelAngle = (d) => xRadial(d.vehicle) + xRadial.bandwidth() / 2;

    labels.enter().append("text")
        .attr("class", "radial-label")
        .attr("text-anchor", d => (getLabelAngle(d) > Math.PI ? "end" : "start"))
        .attr("transform", d => {
            const angle = getLabelAngle(d) - Math.PI / 2;
            const x = yRadial(d.impactScore) * Math.cos(angle);
            const y = yRadial(d.impactScore) * Math.sin(angle);
            
            // Rotate the text to be perpendicular to the bar
            const rotation = (getLabelAngle(d) * 180 / Math.PI) - 90;
            return `translate(${x}, ${y}) rotate(${rotation})`;
        })
        .merge(labels)
        .transition().duration(1500)
        .attr("x", 10) // Small offset
        .attr("y", 0) // Centered on the bar end line
        .attr("transform", d => {
            // Position the label slightly outside the bar end
            const angle = getLabelAngle(d) - Math.PI / 2;
            const r = yRadial(d.impactScore) + 15; // 15px outside the bar
            const x = r * Math.cos(angle);
            const y = r * Math.sin(angle);
            
            // Text rotation fix
            let rotation = (getLabelAngle(d) * 180 / Math.PI) - 90;
            if (getLabelAngle(d) > Math.PI) {
                 rotation += 180; // Flip text on the left side
            }
            
            return `translate(${x}, ${y}) rotate(${rotation})`;
        })
        .text(d => `${d.vehicle}: ${d3.format(".0%")(d.impactScore)}`);


    // 7. Center Text (Title and comparison)
    
    // Clear previous center text
    chartGroup.selectAll(".center-text").remove(); 

    // Calculate the difference for center display
    const evImpact = data.find(d => d.vehicle.startsWith('EV')).impactScore;
    const iceImpact = data.find(d => d.vehicle.startsWith('ICE')).impactScore;
    const difference = ((evImpact - iceImpact) / iceImpact); 

    chartGroup.append("text")
        .attr("class", "center-text impact-center-text")
        .attr("y", -10)
        .text(d3.format("+.0%")(difference));
        
    chartGroup.append("text")
        .attr("class", "center-text impact-unit-text")
        .attr("y", 30)
        .text("Higher Impact than ICE");
        
    // 8. Exit Selection
    bars.exit().remove();
    labels.exit().remove();
};


// --- SCROLL HANDLER (Intersection Observer) ---

const setupScrollHandler = () => {
    // Disconnect old observer if it exists
    if (observer) observer.disconnect();

    const visibleSectionId = `${currentStory}-story`;
    const steps = d3.selectAll(`#${visibleSectionId} .step`).nodes();
    
    // Reset active class across all stories
    d3.selectAll('.story-sections .step').classed('is-active', false);
    
    // Set the first step of the visible story as active initially
    d3.select(`#${visibleSectionId} .step[data-step="0"]`).classed('is-active', true);

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            const stepIndex = parseInt(entry.target.dataset.step);

            if (entry.isIntersecting) {
                
                // Only mark active in the currently visible story
                d3.selectAll(`#${visibleSectionId} .step`).classed('is-active', false);
                d3.select(entry.target).classed('is-active', true);
                
                // CRITICAL VISIBILITY LOGIC: ONLY show for Critical Story, Step 2
                if (currentStory === 'critical' && stepIndex === TARGET_STEP_INDEX) {
                    graphicCol.classList.remove('is-hidden');
                    updateVisualization();
                } else {
                    graphicCol.classList.add('is-hidden');
                }
            } else if (currentStory === 'critical' && stepIndex === TARGET_STEP_INDEX && !entry.isIntersecting) {
                 // Ensure it hides immediately when leaving step 2 of critical view
                 graphicCol.classList.add('is-hidden');
            }
        });
    }, {
        root: null, // viewport
        rootMargin: "-45% 0px -45% 0px", // Trigger zone in the middle of the screen
        threshold: 0 
    });

    // Attach observer to each step in the *active* story
    steps.forEach(step => observer.observe(step));
    
    // Ensure graphic is hidden when setting up the observer (e.g., when switching stories)
    graphicCol.classList.add('is-hidden'); 
};


// --- STORY TOGGLE LOGIC ---

const updateStory = (story) => {
    if (story === currentStory) return; // No change needed

    currentStory = story;
    
    // 1. Update UI (Buttons and Story Visibility)
    if (story === 'balanced') {
        balancedBtn.classList.add('is-active-view', 'bg-green-700');
        balancedBtn.classList.remove('bg-green-600');
        criticalBtn.classList.remove('is-active-view', 'bg-red-700');
        criticalBtn.classList.add('bg-red-600');
        balancedStoryDiv.style.display = 'block';
        criticalStoryDiv.style.display = 'none';
        
    } else if (story === 'critical') {
        criticalBtn.classList.add('is-active-view', 'bg-red-700');
        criticalBtn.classList.remove('bg-red-600');
        balancedBtn.classList.remove('is-active-view', 'bg-green-700');
        balancedBtn.classList.add('bg-green-600');
        criticalStoryDiv.style.display = 'block';
        balancedStoryDiv.style.display = 'none';
    }

    // 2. Reset scroll position to the top of the sections-col
    document.getElementById('sections-col').scrollTop = 0;
    window.scrollTo(0, 0);

    // 3. Re-initialize the scroll handler for the new active story
    setupScrollHandler();
};


// --- Entry Point ---
window.onload = function() {
    // 1. Initialize D3 elements (SVG, scales, axis, etc.)
    initializeVisualization();
    
    // 2. Setup initial state and listeners
    // Default to 'balanced' view on load
    updateStory('balanced'); 
    
    balancedBtn.addEventListener('click', () => updateStory('balanced'));
    criticalBtn.addEventListener('click', () => updateStory('critical'));
    
    // Initial setup of the scroll handler is called inside updateStory('balanced')
};

// --- Handle Resize ---
window.addEventListener('resize', () => {
    if (window.resizeTimer) clearTimeout(window.resizeTimer);
    window.resizeTimer = setTimeout(() => {
        
        const visibleSectionId = `${currentStory}-story`;
        // Find the index of the currently active step
        const activeStepElement = d3.select(`#${visibleSectionId} .step.is-active`).node();
        const activeStepIndex = activeStepElement ? parseInt(activeStepElement.dataset.step) : 0;
        
        initializeVisualization(); // Always re-initialize to update dimensions
        
        // If we are at the target step AND in the critical story, redraw the visualization
        if (currentStory === 'critical' && activeStepIndex === TARGET_STEP_INDEX) {
            updateVisualization(); 
            graphicCol.classList.remove('is-hidden');
        } else {
            // Otherwise, ensure it remains hidden
            graphicCol.classList.add('is-hidden');
        }

        // Re-setup the scroll handler
        setupScrollHandler();
    }, 250);
});