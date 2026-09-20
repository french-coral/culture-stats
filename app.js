let stats = null;
let currentDatabase = "all";
let currentActivityView = "heatmap";

const databaseSelect = document.getElementById("database-select");

const totalValue = document.getElementById("total-value");
const totalDescription = document.getElementById("total-description");
const totalDonut = document.getElementById("total-donut");
const databaseBreakdown = document.getElementById("database-breakdown");

const yearSummary = document.getElementById("year-summary");

const yearFrom = document.getElementById("year-from");
const yearTo = document.getElementById("year-to");
const heatmapYear = document.getElementById("heatmap-year");

const heatmap = document.getElementById("heatmap");
const yearChart = document.getElementById("year-chart");

const heatmapToggle = document.getElementById("heatmap-toggle");
const curveToggle = document.getElementById("curve-toggle");

const heatmapView = document.getElementById("heatmap-view");
const curveView = document.getElementById("curve-view");

const activityDescription =
  document.getElementById("activity-description");

const releaseAgeValue =
  document.getElementById("release-age-value");

const releaseYearValue =
  document.getElementById("release-year-value");

const releaseAgeCount =
  document.getElementById("release-age-count");

const ratingAverage =
  document.getElementById("rating-average");

const ratingTotal =
  document.getElementById("rating-total");

const ratingChart =
  document.getElementById("rating-chart");

const updated =
  document.getElementById("updated");

const tooltip =
  document.getElementById("tooltip");

const themeToggle =
  document.getElementById("theme-toggle");


/* --------------------------------------------------
   Database colors
-------------------------------------------------- */

const DATABASE_COLORS = {
  video_games: "#A8C7FA",
  games: "#B8E0C2",
  reads: "#E8C6A8",
  multimedia: "#C9B6E4",
  music: "#F1C7D5"
};


/* --------------------------------------------------
   Theme
-------------------------------------------------- */

function setupTheme() {

  const savedTheme =
    localStorage.getItem("culture-stats-theme");

  if (savedTheme) {
    document.documentElement.dataset.theme =
      savedTheme;
  }

  themeToggle.addEventListener("click", () => {

    const current =
      document.documentElement.dataset.theme;

    const next =
      current === "dark" ? "light" : "dark";

    document.documentElement.dataset.theme =
      next;

    localStorage.setItem(
      "culture-stats-theme",
      next
    );

    renderTotalDonut();
  });
}


/* --------------------------------------------------
   Database selector
-------------------------------------------------- */

function setupDatabaseSelector() {

  databaseSelect.innerHTML = "";

  const allOption =
    document.createElement("option");

  allOption.value = "all";
  allOption.textContent = "All";

  databaseSelect.appendChild(allOption);

  Object.entries(stats.databases)
    .filter(([key]) => key !== "all")
    .forEach(([key, database]) => {

      const option =
        document.createElement("option");

      option.value = key;
      option.textContent = database.name;

      databaseSelect.appendChild(option);
    });

  databaseSelect.value = currentDatabase;

  databaseSelect.addEventListener("change", () => {

    currentDatabase =
      databaseSelect.value;

    renderDashboard();
  });
}


/* --------------------------------------------------
   Helpers
-------------------------------------------------- */

function getCurrentData() {
  return stats.databases[currentDatabase];
}


function getYears(data) {

  return Object.keys(data.years || {})
    .map(Number)
    .sort((a, b) => a - b);
}


function formatNumber(value) {

  return new Intl.NumberFormat().format(value);
}


function showTooltip(event, text) {

  tooltip.textContent = text;

  tooltip.style.left =
    `${event.clientX + 10}px`;

  tooltip.style.top =
    `${event.clientY + 10}px`;

  tooltip.classList.add("visible");
}


function hideTooltip() {

  tooltip.classList.remove("visible");
}


/* --------------------------------------------------
   Total Entries
-------------------------------------------------- */

function renderTotal() {

  const data =
    getCurrentData();

  totalValue.textContent =
    formatNumber(data.total || 0);

  totalDescription.textContent =
    data.name || "All databases";

  renderTotalDonut();
  renderDatabaseBreakdown();
}


function renderTotalDonut() {

  const data =
    getCurrentData();

  if (
    currentDatabase !== "all" ||
    !data.breakdown
  ) {

    totalDonut.style.background =
      "conic-gradient(#b9b9b9 0deg 360deg)";

    return;
  }

  const entries =
    Object.entries(data.breakdown);

  const total =
    entries.reduce(
      (sum, [, value]) => sum + value,
      0
    );

  if (!total) {

    totalDonut.style.background =
      "conic-gradient(#b9b9b9 0deg 360deg)";

    return;
  }

  let start = 0;

  const gradients = [];

  entries.forEach(([key, value]) => {

    const percentage =
      value / total;

    const end =
      start + percentage * 360;

    const color =
      DATABASE_COLORS[key] || "#bbbbbb";

    gradients.push(
      `${color} ${start}deg ${end}deg`
    );

    start = end;
  });

  totalDonut.style.background =
    `conic-gradient(${gradients.join(", ")})`;
}


function renderDatabaseBreakdown() {

  databaseBreakdown.innerHTML = "";

  const data =
    getCurrentData();

  if (
    currentDatabase !== "all" ||
    !data.breakdown
  ) {
    return;
  }

  Object.entries(data.breakdown)
    .forEach(([key, value]) => {

      const item =
        document.createElement("div");

      item.className =
        "breakdown-item";

      const dot =
        document.createElement("span");

      dot.className =
        "breakdown-dot";

      dot.style.background =
        DATABASE_COLORS[key] || "#bbb";

      const label =
        document.createElement("span");

      const database =
        stats.databases[key];

      label.textContent =
        `${database?.name || key}: ${formatNumber(value)}`;

      item.appendChild(dot);
      item.appendChild(label);

      databaseBreakdown.appendChild(item);
    });
}


/* --------------------------------------------------
   Year Summary
-------------------------------------------------- */

function renderYearSummary() {

  const data =
    getCurrentData();

  yearSummary.innerHTML = "";

  const years =
    getYears(data)
      .reverse();

  if (!years.length) {

    yearSummary.textContent =
      "No data available.";

    return;
  }

  years.forEach(year => {

    const row =
      document.createElement("div");

    row.className =
      "year-summary-row";

    const yearElement =
      document.createElement("span");

    yearElement.className =
      "year-summary-year";

    yearElement.textContent =
      year;

    const value =
      document.createElement("span");

    value.className =
      "year-summary-value";

    value.textContent =
      `${formatNumber(data.years[year])} entries`;

    row.appendChild(yearElement);
    row.appendChild(value);

    yearSummary.appendChild(row);
  });
}


/* --------------------------------------------------
   Activity view
-------------------------------------------------- */

function setActivityView(view) {

  currentActivityView =
    view;

  const isHeatmap =
    view === "heatmap";

  heatmapView.classList.toggle(
    "active",
    isHeatmap
  );

  curveView.classList.toggle(
    "active",
    !isHeatmap
  );

  heatmapToggle.classList.toggle(
    "active",
    isHeatmap
  );

  curveToggle.classList.toggle(
    "active",
    !isHeatmap
  );

  activityDescription.textContent =
    isHeatmap
      ? "Entries added to your databases"
      : "Number of entries added each year";

  document.querySelector(".range-controls").style.display =
    isHeatmap ? "none" : "flex";
}


heatmapToggle.addEventListener(
  "click",
  () => setActivityView("heatmap")
);


curveToggle.addEventListener(
  "click",
  () => setActivityView("curve")
);


/* --------------------------------------------------
   Year selectors
-------------------------------------------------- */

function setupYearSelectors() {

  const data =
    getCurrentData();

  const years =
    getYears(data);

  yearFrom.innerHTML = "";
  yearTo.innerHTML = "";
  heatmapYear.innerHTML = "";

  if (!years.length) {
    return;
  }

  years.forEach(year => {

    const fromOption =
      document.createElement("option");

    fromOption.value = year;
    fromOption.textContent = year;

    yearFrom.appendChild(fromOption);


    const toOption =
      document.createElement("option");

    toOption.value = year;
    toOption.textContent = year;

    yearTo.appendChild(toOption);


    const heatmapOption =
      document.createElement("option");

    heatmapOption.value = year;
    heatmapOption.textContent = year;

    heatmapYear.appendChild(heatmapOption);
  });

  yearFrom.value =
    years[0];

  yearTo.value =
    years[years.length - 1];

  heatmapYear.value =
    years[years.length - 1];

  yearFrom.onchange =
    renderYearChart;

  yearTo.onchange =
    renderYearChart;

  heatmapYear.onchange =
    renderHeatmap;

  renderYearChart();
  renderHeatmap();
}


/* --------------------------------------------------
   Heatmap
-------------------------------------------------- */

function renderHeatmap() {

  const data =
    getCurrentData();

  const year =
    Number(heatmapYear.value);

  heatmap.innerHTML = "";

  const heatmapData =
    data.heatmap || {};

  const start =
    new Date(year, 0, 1);

  const end =
    new Date(year, 11, 31);

  const firstDay =
    start.getDay();

  const days = [];

  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {

    days.push(
      new Date(date)
    );
  }

  const weeks =
    Math.ceil(
      (firstDay + days.length) / 7
    );

  const grid =
    document.createElement("div");

  grid.className =
    "heatmap-grid";

  grid.style.gridTemplateColumns =
    `repeat(${weeks}, minmax(8px, 1fr))`;

  for (
    let week = 0;
    week < weeks;
    week++
  ) {

    for (
      let day = 0;
      day < 7;
      day++
    ) {

      const index =
        week * 7 + day - firstDay;

      const cell =
        document.createElement("div");

      cell.className =
        "heatmap-cell";

      if (
        index >= 0 &&
        index < days.length
      ) {

        const date =
          days[index];

        const key =
          date.toISOString()
            .slice(0, 10);

        const count =
          heatmapData[key] || 0;

        if (count > 0) {

          const intensity =
            Math.min(
              1,
              count / Math.max(
                1,
                getMaxHeatmapValue(
                  heatmapData
                )
              )
            );

          const light =
            document.documentElement.dataset.theme ===
            "dark";

          cell.style.background =
            light
              ? `rgba(180, 210, 190, ${0.25 + intensity * 0.7})`
              : `rgba(80, 150, 100, ${0.15 + intensity * 0.7})`;

        }

        cell.addEventListener(
          "mouseenter",
          event => {

            showTooltip(
              event,
              `${key}: ${count} ${
                count === 1
                  ? "entry"
                  : "entries"
              }`
            );
          }
        );

        cell.addEventListener(
          "mouseleave",
          hideTooltip
        );

      } else {

        cell.style.visibility =
          "hidden";
      }

      grid.appendChild(cell);
    }
  }

  heatmap.appendChild(grid);
}


function getMaxHeatmapValue(data) {

  return Math.max(
    1,
    ...Object.values(data)
  );
}


/* --------------------------------------------------
   Year curve
-------------------------------------------------- */

function renderYearChart() {

  const data =
    getCurrentData();

  const from =
    Number(yearFrom.value);

  const to =
    Number(yearTo.value);

  if (
    !from ||
    !to ||
    from > to
  ) {
    yearChart.innerHTML = "";
    return;
  }

  const years = [];

  for (
    let year = from;
    year <= to;
    year++
  ) {

    years.push(year);
  }

  const values =
    years.map(
      year =>
        data.years?.[year] || 0
    );

  if (!values.length) {
    yearChart.innerHTML = "";
    return;
  }

  const width = 800;
  const height = 220;

  const paddingLeft = 35;
  const paddingRight = 15;
  const paddingTop = 15;
  const paddingBottom = 30;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxValue =
    Math.max(
      1,
      ...values
    );

  const points =
    values.map(
      (value, index) => {

        const x =
          paddingLeft +
          (
            index /
            Math.max(
              1,
              values.length - 1
            )
          ) *
          chartWidth;

        const y =
          paddingTop +
          chartHeight -
          (value / maxValue) *
          chartHeight;

        return { x, y, value };
      }
    );

  const path =
    points.map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
    ).join(" ");


  let svg = `
    <svg
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
    >
      <line
        class="chart-axis"
        x1="${paddingLeft}"
        y1="${paddingTop + chartHeight}"
        x2="${width - paddingRight}"
        y2="${paddingTop + chartHeight}"
      />

      <path
        class="chart-line"
        d="${path}"
      />
  `;

  points.forEach(
    (point, index) => {

      svg += `
        <circle
          class="chart-dot"
          cx="${point.x}"
          cy="${point.y}"
          r="4"
          data-year="${years[index]}"
          data-value="${point.value}"
        />
      `;
    }
  );


  if (years.length) {

    const labelIndexes =
      years.length <= 6
        ? years.map((_, i) => i)
        : [
            0,
            Math.floor(
              years.length / 2
            ),
            years.length - 1
          ];

    [...new Set(labelIndexes)]
      .forEach(index => {

        const point =
          points[index];

        svg += `
          <text
            class="chart-label"
            x="${point.x}"
            y="${height - 8}"
            text-anchor="middle"
          >
            ${years[index]}
          </text>
        `;
      });
  }

  svg += "</svg>";

  yearChart.innerHTML =
    svg;


  yearChart
    .querySelectorAll(".chart-dot")
    .forEach(dot => {

      dot.addEventListener(
        "mouseenter",
        event => {

          showTooltip(
            event,
            `${dot.dataset.year}: ${dot.dataset.value} entries`
          );
        }
      );

      dot.addEventListener(
        "mouseleave",
        hideTooltip
      );
    });
}


/* --------------------------------------------------
   Release Age
-------------------------------------------------- */

function renderReleaseAge() {

  const data =
    getCurrentData();

  const releaseAge =
    data.release_age || {};

  releaseAgeValue.textContent =
    releaseAge.average != null
      ? Number(
          releaseAge.average
        ).toFixed(1)
      : "—";


  /*
   * This will start displaying automatically
   * once generate_stats.py adds:
   *
   * average_release_year
   */

  releaseYearValue.textContent =
    releaseAge.average_release_year != null
      ? Number(
          releaseAge.average_release_year
        ).toFixed(1)
      : "—";


  releaseAgeCount.textContent =
    releaseAge.entries_with_data
      ? `${formatNumber(
          releaseAge.entries_with_data
        )} entries with release data`
      : "";
}


/* --------------------------------------------------
   Ratings
-------------------------------------------------- */

function renderRatings() {

  const data =
    getCurrentData();

  const ratings =
    data.ratings || {};

  const distribution =
    ratings.distribution || {};

  ratingAverage.textContent =
    ratings.average != null
      ? Number(
          ratings.average
        ).toFixed(1)
      : "—";

  ratingTotal.textContent =
    formatNumber(
      ratings.rated_total || 0
    );

  ratingChart.innerHTML = "";

  const values =
    [];

  for (
    let rating = -5;
    rating <= 5;
    rating++
  ) {

    values.push({
      rating,
      value:
        Number(
          distribution[
            String(rating)
          ] || 0
        )
    });
  }

  const max =
    Math.max(
      1,
      ...values.map(
        item => item.value
      )
    );

  values.forEach(item => {

    const container =
      document.createElement("div");

    container.className =
      "rating-bar-container";

    const bar =
      document.createElement("div");

    bar.className =
      "rating-bar";

    bar.style.height =
      `${(item.value / max) * 100}%`;

    const label =
      document.createElement("div");

    label.className =
      "rating-label";

    label.textContent =
      item.rating > 0
        ? `+${item.rating}`
        : item.rating;

    container.appendChild(bar);
    container.appendChild(label);

    container.addEventListener(
      "mouseenter",
      event => {

        showTooltip(
          event,
          `${item.rating}: ${item.value} entries`
        );
      }
    );

    container.addEventListener(
      "mouseleave",
      hideTooltip
    );

    ratingChart.appendChild(
      container
    );
  });
}


/* --------------------------------------------------
   Main render
-------------------------------------------------- */

function renderDashboard() {

  renderTotal();

  renderYearSummary();

  setupYearSelectors();

  renderReleaseAge();

  renderRatings();

  setActivityView(
    currentActivityView
  );
}


/* --------------------------------------------------
   Load stats
-------------------------------------------------- */

async function loadStats() {

  try {

    const response =
      await fetch(
        "stats.json?" +
        Date.now()
      );

    if (!response.ok) {
      throw new Error(
        "Could not load stats.json"
      );
    }

    stats =
      await response.json();

    updated.textContent =
      stats.updated_at
        ? `Updated ${new Date(
            stats.updated_at
          ).toLocaleString()}`
        : "";

    setupDatabaseSelector();

    setupTheme();

    renderDashboard();

  } catch (error) {

    console.error(error);

    updated.textContent =
      "Unable to load statistics.";

  }
}


loadStats();