# CS578_Data_Viz_Scrollytelling_Project
Charging Ahead or Burning Out? 
Visualizing the Environmental Trade-Offs Between EVs and ICE Vehicles

This project is a scrollytelling data visualization created for the ASU CSE 578 (Data Visualization) course. It provides a comprehensive, balanced comparison of the total lifecycle environmental impact of Electric Vehicles (EVs) and Internal Combustion Engine (ICE) vehicles.

The visualization transforms complex data points—such as manufacturing emissions, operational efficiency, and grid carbon intensity—into an engaging, narrative-driven experience.

📊 Visualization Concept (Scrollytelling)

The core visualization uses a comparative scale where two icons (one representing EV and one representing ICE) move along a normalized vertical scale. As the user scrolls through the narrative sections, the icons move to new positions, visually illustrating which vehicle performs "better" or "worse" for the metric currently being discussed (e.g., higher battery production cost vs. lower operational emissions).

🛠️ Technology Stack

HTML/CSS: For structure and styling (using Tailwind CSS for utility classes).

JavaScript (ES6): For application logic.

D3.js (Data-Driven Documents): Used for creating and animating the scalable vector graphics (SVG) visualization based on the scroll position.

Intersection Observer API: Used to detect when a narrative section enters the viewport, triggering the D3 visualization update.

🤝 Team and Subgroups

This project was developed by two subgroups to ensure a comprehensive, dual-perspective analysis:

Group A (Pro-EV Team): Focused on showcasing the long-term operational benefits and sustainability of EVs.

Group B (Against-EV Team): Focused on critically analyzing the hidden costs, such as battery manufacturing and material mining.
