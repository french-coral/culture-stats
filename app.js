async function loadStats() {
    const response = await fetch("./stats.json");

    if (!response.ok) {
        throw new Error("Could not load stats.json");
    }

    const data = await response.json();

    const statsContainer = document.getElementById("stats");
    const updatedElement = document.getElementById("updated");

    const updated = new Date(data.updated_at);

    updatedElement.textContent =
        `Updated ${updated.toLocaleString()}`;

    for (const database of Object.values(data.databases)) {
        const card = document.createElement("div");

        card.className = "stat-card";

        card.innerHTML = `
            <div class="stat-name">${database.name}</div>
            <div class="stat-value">${database.total}</div>
        `;

        statsContainer.appendChild(card);
    }
}

loadStats().catch(error => {
    console.error(error);

    document.getElementById("stats").innerHTML =
        "<p>Unable to load statistics.</p>";
});