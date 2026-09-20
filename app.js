let stats = null;
let currentDatabase = null;

const themeQuery = window.matchMedia(
    "(prefers-color-scheme: dark)"
);


// --------------------------------------------------
// THEME
// --------------------------------------------------

function applyTheme() {
    const savedTheme =
        localStorage.getItem("theme");

    document.documentElement.classList.remove(
        "light",
        "dark"
    );

    if (savedTheme === "light") {
        document.documentElement.classList.add(
            "light"
        );
    } else if (savedTheme === "dark") {
        document.documentElement.classList.add(
            "dark"
        );
    } else {
        document.documentElement.classList.add(
            themeQuery.matches
                ? "dark"
                : "light"
        );
    }
}

document
    .getElementById("theme-toggle")
    .addEventListener("click", () => {

        const isDark =
            document.documentElement.classList.contains(
                "dark"
            );

        localStorage.setItem(
            "theme",
            isDark ? "light" : "dark"
        );

        applyTheme();
    });

themeQuery.addEventListener(
    "change",
    () => {

        if (!localStorage.getItem("theme")) {
            applyTheme();
        }
    }
);

applyTheme();


// --------------------------------------------------
// HELPERS
// --------------------------------------------------

function getYears(database) {
    return Object.keys(database.years)
        .map(Number)
        .sort((a, b) => a - b);
}


function createOption(
    value,
    label = value
) {
    const option =
        document.createElement("option");

    option.value = value;
    option.textContent = label;

    return option;
}


function populateSelect(
    select,
    values
) {
    select.innerHTML = "";

    for (const value of values) {
        select.appendChild(
            createOption(value)
        );
    }
}


// --------------------------------------------------
// DATABASE
// --------------------------------------------------

function setupDatabaseSelector() {

    const select =
        document.getElementById(
            "database-select"
        );

    select.innerHTML = "";

    for (
        const [key, database]
        of Object.entries(
            stats.databases
        )
    ) {

        const option =
            createOption(
                key,
                database.name
            );

        select.appendChild(option);
    }

    select.value =
        Object.keys(
            stats.databases
        )[0];

    select.addEventListener(
        "change",
        () => {

            currentDatabase =
                stats.databases[
                    select.value
                ];

            renderAll();
        }
    );
}


// --------------------------------------------------
// TOTAL
// --------------------------------------------------

function renderTotal() {

    document.getElementById(
        "total-value"
    ).textContent =
        currentDatabase.total;
}


// --------------------------------------------------
// YEAR CHART
// --------------------------------------------------

function setupYearRange() {

    const years =
        getYears(currentDatabase);

    const start =
        document.getElementById(
            "range-start"
        );

    const end =
        document.getElementById(
            "range-end"
        );

    populateSelect(start, years);
    populateSelect(end, years);

    start.value = years[0];
    end.value = years[years.length - 1];

    start.onchange = renderYearChart;
    end.onchange = renderYearChart;
}


function renderYearChart() {

    const years =
        getYears(currentDatabase);

    let start =
        Number(
            document.getElementById(
                "range-start"
            ).value
        );

    let end =
        Number(
            document.getElementById(
                "range-end"
            ).value
        );

    if (start > end) {
        [start, end] =
            [end, start];

        document.getElementById(
            "range-start"
        ).value = start;

        document.getElementById(
            "range-end"
        ).value = end;
    }

    const chart =
        document.getElementById(
            "year-chart"
        );

    chart.innerHTML = "";

    const selectedYears =
        years.filter(
            year =>
                year >= start &&
                year <= end
        );

    const values =
        selectedYears.map(
            year =>
                currentDatabase.years[
                    String(year)
                ] || 0
        );

    const max =
        Math.max(...values, 1);

    for (
        let index = 0;
        index < selectedYears.length;
        index++
    ) {

        const year =
            selectedYears[index];

        const value =
            values[index];

        const column =
            document.createElement(
                "div"
            );

        column.className =
            "year-column";

        const valueElement =
            document.createElement(
                "div"
            );

        valueElement.className =
            "year-value";

        valueElement.textContent =
            value;

        const barArea =
            document.createElement(
                "div"
            );

        barArea.className =
            "year-bar-area";

        const bar =
            document.createElement(
                "div"
            );

        bar.className =
            "year-bar";

        bar.style.height =
            `${(value / max) * 100}%`;

        bar.title =
            `${value} entries in ${year}`;

        const label =
            document.createElement(
                "div"
            );

        label.className =
            "year-label";

        label.textContent =
            year;

        barArea.appendChild(bar);

        column.appendChild(
            valueElement
        );

        column.appendChild(
            barArea
        );

        column.appendChild(
            label
        );

        chart.appendChild(column);
    }
}


// --------------------------------------------------
// YEAR SUMMARY
// --------------------------------------------------

function setupSummaryYears() {

    const years =
        Object.keys(
            currentDatabase.year_stats
        )
        .map(Number)
        .sort(
            (a, b) => a - b
        );

    const select =
        document.getElementById(
            "summary-year"
        );

    populateSelect(
        select,
        years
    );

    select.value =
        years[years.length - 1];

    select.onchange =
        renderYearSummary;
}


function renderYearSummary() {

    const year =
        document.getElementById(
            "summary-year"
        ).value;

    const data =
        currentDatabase.year_stats[
            year
        ];

    document.getElementById(
        "summary-year-label"
    ).textContent =
        `Statistics for ${year}`;

    if (!data) {
        document.getElementById(
            "summary-total"
        ).textContent = "0";

        document.getElementById(
            "summary-months"
        ).textContent = "0";

        document.getElementById(
            "summary-average"
        ).textContent = "0";

        return;
    }

    document.getElementById(
        "summary-total"
    ).textContent =
        data.total;

    document.getElementById(
        "summary-months"
    ).textContent =
        data.active_months;

    document.getElementById(
        "summary-average"
    ).textContent =
        data.average_per_active_month;
}


// --------------------------------------------------
// RATINGS
// --------------------------------------------------

function renderRatings() {

    const chart =
        document.getElementById(
            "rating-chart"
        );

    chart.innerHTML = "";

    const distribution =
        currentDatabase.ratings
            .distribution;

    const values =
        Object.entries(
            distribution
        );

    const max =
        Math.max(
            ...values.map(
                ([, value]) =>
                    value
            ),
            1
        );

    for (
        const [rating, value]
        of values
    ) {

        const row =
            document.createElement(
                "div"
            );

        row.className =
            "rating-row";

        const label =
            document.createElement(
                "div"
            );

        label.className =
            "rating-label";

        label.textContent =
            Number(rating) > 0
                ? `+${rating}`
                : rating;

        const track =
            document.createElement(
                "div"
            );

        track.className =
            "rating-track";

        const bar =
            document.createElement(
                "div"
            );

        bar.className =
            "rating-bar";

        bar.style.width =
            `${(value / max) * 100}%`;

        track.appendChild(bar);

        const valueElement =
            document.createElement(
                "div"
            );

        valueElement.className =
            "rating-value";

        valueElement.textContent =
            value;

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(
            valueElement
        );

        chart.appendChild(row);
    }

    const average =
        currentDatabase.ratings.average;

    document.getElementById(
        "rating-average"
    ).textContent =
        average === null
            ? "Average rating: —"
            : `Average rating: ${
                average > 0
                    ? "+" + average
                    : average
            }`;
}


// --------------------------------------------------
// RELEASE AGE
// --------------------------------------------------

function renderReleaseAge() {

    const data =
        currentDatabase.release_age;

    document.getElementById(
        "release-age"
    ).textContent =
        data.average === null
            ? "—"
            : data.average;

    document.getElementById(
        "release-age-coverage"
    ).textContent =
        data.average === null
            ? "No usable release-date data"
            : `${data.entries_with_data} entries with release and consumption years`;
}


// --------------------------------------------------
// HEATMAP
// --------------------------------------------------

function setupHeatmapYears() {

    const years =
        new Set();

    for (
        const date
        of Object.keys(
            currentDatabase.heatmap
        )
    ) {

        years.add(
            Number(
                date.slice(0, 4)
            )
        );
    }

    const sortedYears =
        [...years].sort(
            (a, b) => a - b
        );

    const select =
        document.getElementById(
            "heatmap-year"
        );

    populateSelect(
        select,
        sortedYears
    );

    select.value =
        sortedYears[
            sortedYears.length - 1
        ];

    select.onchange =
        renderHeatmap;
}


function getHeatLevel(
    value,
    max
) {

    if (!value) {
        return 0;
    }

    if (max <= 1) {
        return 4;
    }

    const ratio =
        value / max;

    if (ratio <= 0.25) return 1;
    if (ratio <= 0.5) return 2;
    if (ratio <= 0.75) return 3;

    return 4;
}


function renderHeatmap() {

    const year =
        Number(
            document.getElementById(
                "heatmap-year"
            ).value
        );

    const container =
        document.getElementById(
            "heatmap"
        );

    container.innerHTML = "";

    const heatmap =
        currentDatabase.heatmap;

    const values =
        Object.entries(heatmap)
            .filter(
                ([date]) =>
                    Number(
                        date.slice(0, 4)
                    ) === year
            )
            .map(
                ([, value]) =>
                    value
            );

    const max =
        Math.max(...values, 1);

    const start =
        new Date(
            Date.UTC(
                year,
                0,
                1
            )
        );

    const end =
        new Date(
            Date.UTC(
                year + 1,
                0,
                1
            )
        );

    // Move back to Monday.
    const startDay =
        (start.getUTCDay() + 6) % 7;

    start.setUTCDate(
        start.getUTCDate() -
        startDay
    );

    while (start < end) {

        for (
            let day = 0;
            day < 7;
            day++
        ) {

            const current =
                new Date(start);

            current.setUTCDate(
                current.getUTCDate() +
                day
            );

            const iso =
                current
                    .toISOString()
                    .slice(0, 10);

            const cell =
                document.createElement(
                    "div"
                );

            cell.className =
                "heat-cell";

            const count =
                heatmap[iso] || 0;

            cell.dataset.level =
                getHeatLevel(
                    count,
                    max
                );

            if (
                current.getUTCFullYear() ===
                year
            ) {

                const dateLabel =
                    current.toLocaleDateString(
                        undefined,
                        {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                        }
                    );

                cell.title =
                    `${dateLabel}: ${count} ${
                        count === 1
                            ? "entry"
                            : "entries"
                    }`;
            } else {
                cell.style.visibility =
                    "hidden";
            }

            container.appendChild(cell);
        }

        start.setUTCDate(
            start.getUTCDate() + 7
        );
    }
}


// --------------------------------------------------
// RENDER EVERYTHING
// --------------------------------------------------

function renderAll() {

    renderTotal();

    setupYearRange();
    renderYearChart();

    setupSummaryYears();
    renderYearSummary();

    renderRatings();

    renderReleaseAge();

    setupHeatmapYears();
    renderHeatmap();
}


// --------------------------------------------------
// LOAD DATA
// --------------------------------------------------

async function loadStats() {

    const response =
        await fetch(
            "./stats.json"
        );

    if (!response.ok) {
        throw new Error(
            "Could not load stats.json"
        );
    }

    stats =
        await response.json();

    document.getElementById(
        "updated"
    ).textContent =
        `Updated ${
            new Date(
                stats.updated_at
            ).toLocaleString()
        }`;

    setupDatabaseSelector();

    currentDatabase =
        stats.databases[
            document.getElementById(
                "database-select"
            ).value
        ];

    renderAll();
}


loadStats().catch(error => {

    console.error(error);

    document.getElementById(
        "updated"
    ).textContent =
        "Unable to load statistics.";

});