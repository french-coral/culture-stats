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

//const releaseAgeValue =
//  document.getElementById("release-age-value");

const releaseYearValue =
  document.getElementById("release-year-value");

// const releaseAgeCount =
//   document.getElementById("release-age-count");

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

  const data = getCurrentData();

  yearSummary.innerHTML = "";

  const years = getYears(data);

  if (!years.length) {
    yearSummary.textContent = "No data available.";
    return;
  }

  // Use the latest/current year available.
  const year = years[years.length - 1];

  const statsForYear =
    data.year_stats?.[year];

  if (!statsForYear) {
    yearSummary.textContent = "No data available.";
    return;
  }

  const entries =
    statsForYear.total || 0;

  const average =
    statsForYear.average_per_active_month ?? 0;

  const activeMonths =
    statsForYear.active_months || 0;

  const items = [
    {
      value: formatNumber(entries),
      label: `Entries in ${year}`
    },
    {
      value: Number(average).toFixed(1),
      label: "Average entries / active month"
    },
    {
      value: activeMonths,
      label: "Active months"
    }
  ];

  items.forEach(item => {

    const row =
      document.createElement("div");

    row.className =
      "year-summary-row";

    const value =
      document.createElement("strong");

    value.className =
      "year-summary-value";

    value.textContent =
      item.value;

    const label =
      document.createElement("span");

    label.className =
      "year-summary-label";

    label.textContent =
      item.label;

    row.appendChild(value);
    row.appendChild(label);

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

            const maxValue =
                Math.max(
                1,
                getMaxHeatmapValue(heatmapData)
                );

            const intensity =
                Math.min(
                1,
                count / maxValue
                );

            /*
            * Purple scale.
            *
            * Low activity:
            *   rgba(139, 92, 246, ...)
            *
            * High activity:
            *   rgba(88, 28, 135, ...)
            */

            const lightPurple = [139, 92, 246];
            const darkPurple = [88, 28, 135];

            const r =
                Math.round(
                lightPurple[0]
                + (darkPurple[0] - lightPurple[0])
                * intensity
                );

            const g =
                Math.round(
                lightPurple[1]
                + (darkPurple[1] - lightPurple[1])
                * intensity
                );

            const b =
                Math.round(
                lightPurple[2]
                + (darkPurple[2] - lightPurple[2])
                * intensity
                );

            const alpha =
                0.25 + intensity * 0.75;

            cell.style.background =
                `rgba(${r}, ${g}, ${b}, ${alpha})`;
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

function renderYearSummary() {

  const data = getCurrentData();

  yearSummary.innerHTML = "";

  const years = getYears(data);

  if (!years.length) {
    yearSummary.textContent = "No data available.";
    return;
  }

  // Latest year available by default.
  const latestYear = years[years.length - 1];

  const wrapper = document.createElement("div");
  wrapper.className = "year-summary-content";

  // ---------------------------------
  // Header / year selector
  // ---------------------------------

  const header = document.createElement("div");
  header.className = "year-summary-header";

  const title = document.createElement("div");

  const heading = document.createElement("h3");
  heading.textContent = "This year summary";

  const subtitle = document.createElement("p");
  subtitle.textContent = "Consumption activity";

  title.appendChild(heading);
  title.appendChild(subtitle);

  const selector = document.createElement("select");
  selector.className = "year-summary-select";

  years
    .slice()
    .reverse()
    .forEach(year => {

      const option = document.createElement("option");

      option.value = year;
      option.textContent = year;

      if (year === latestYear) {
        option.selected = true;
      }

      selector.appendChild(option);
    });

  header.appendChild(title);
  header.appendChild(selector);

  wrapper.appendChild(header);

  // ---------------------------------
  // Metrics
  // ---------------------------------

  const metrics = document.createElement("div");
  metrics.className = "year-summary-metrics";

  const renderMetrics = year => {

    metrics.innerHTML = "";

    const statsForYear =
      data.year_stats?.[year];

    if (!statsForYear) {

      metrics.innerHTML =
        `<div class="year-summary-empty">
          No data available for ${year}.
        </div>`;

      return;
    }

    const entries =
      statsForYear.total || 0;

    const average =
      statsForYear.average_per_active_month ?? 0;

    const activeMonths =
      statsForYear.active_months || 0;

    const items = [

      {
        value: formatNumber(entries),
        label: `Entries in ${year}`,
      },

      {
        value: Number(average).toFixed(1),
        label: "Average entries / month",
      },

      {
        value: activeMonths,
        label: "Active months",
      },

    ];

    items.forEach(item => {

      const card =
        document.createElement("div");

      card.className =
        "year-summary-metric";

      const value =
        document.createElement("strong");

      value.className =
        "year-summary-value";

      value.textContent =
        item.value;

      const label =
        document.createElement("span");

      label.className =
        "year-summary-label";

      label.textContent =
        item.label;

      card.appendChild(value);
      card.appendChild(label);

      metrics.appendChild(card);
    });
  };

  renderMetrics(latestYear);

  selector.addEventListener(
    "change",
    () => {
      renderMetrics(
        Number(selector.value)
      );
    }
  );

  wrapper.appendChild(metrics);

  yearSummary.appendChild(wrapper);
}


function renderYearChart() {

  const data = getCurrentData();

  yearChart.innerHTML = "";

  const years = getYears(data);

  if (!years.length) {
    yearChart.textContent = "No data available.";
    return;
  }

  // Use the selected year if available,
  // otherwise default to the latest year.
  const selectedYear =
    Number(
      heatmapYear?.value ||
      years[years.length - 1]
    );

  const yearData =
    data.year_stats?.[selectedYear];

  if (!yearData) {
    yearChart.textContent =
      `No data available for ${selectedYear}.`;
    return;
  }

  // ---------------------------------
  // Monthly data
  // ---------------------------------

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];

  const values = monthNames.map(
    (month, index) => ({
      month,
      value:
        yearData.months?.[String(index + 1)] || 0
    })
  );

  const maxValue = Math.max(
    1,
    ...values.map(item => item.value)
  );

  // ---------------------------------
  // Chart container
  // ---------------------------------

  const chart =
    document.createElement("div");

  chart.className =
    "curve-chart";

  // ---------------------------------
  // SVG
  // ---------------------------------

  const width = 900;
  const height = 260;

  const paddingLeft = 42;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 34;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const svg =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg"
    );

  svg.setAttribute(
    "viewBox",
    `0 0 ${width} ${height}`
  );

  svg.setAttribute(
    "preserveAspectRatio",
    "none"
  );

  svg.classList.add(
    "curve-chart-svg"
  );

  // ---------------------------------
  // Grid lines
  // ---------------------------------

  const gridCount = 4;

  for (let i = 0; i <= gridCount; i++) {

    const y =
      paddingTop +
      chartHeight -
      (i / gridCount) *
        chartHeight;

    const line =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "line"
      );

    line.setAttribute(
      "x1",
      paddingLeft
    );

    line.setAttribute(
      "x2",
      width - paddingRight
    );

    line.setAttribute(
      "y1",
      y
    );

    line.setAttribute(
      "y2",
      y
    );

    line.classList.add(
      "curve-grid-line"
    );

    svg.appendChild(line);

    // Y-axis label
    const label =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );

    const value =
      Math.round(
        (maxValue / gridCount) * i
      );

    label.setAttribute(
      "x",
      paddingLeft - 8
    );

    label.setAttribute(
      "y",
      y + 4
    );

    label.setAttribute(
      "text-anchor",
      "end"
    );

    label.classList.add(
      "curve-axis-label"
    );

    label.textContent =
      formatNumber(value);

    svg.appendChild(label);
  }

  // ---------------------------------
  // Calculate points
  // ---------------------------------

  const points =
    values.map((item, index) => {

      const x =
        paddingLeft +
        (index /
          (values.length - 1)) *
          chartWidth;

      const y =
        paddingTop +
        chartHeight -
        (item.value / maxValue) *
          chartHeight;

      return {
        x,
        y,
        value: item.value,
        month: item.month
      };
    });

  // ---------------------------------
  // Filled area
  // ---------------------------------

  const areaPath =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

  const areaStart =
    `M ${points[0].x} ${
      paddingTop + chartHeight
    }`;

  const areaLine =
    points
      .map(
        point =>
          `L ${point.x} ${point.y}`
      )
      .join(" ");

  const areaEnd =
    `L ${
      points[points.length - 1].x
    } ${
      paddingTop + chartHeight
    } Z`;

  areaPath.setAttribute(
    "d",
    `${areaStart} ${areaLine} ${areaEnd}`
  );

  areaPath.classList.add(
    "curve-area"
  );

  svg.appendChild(areaPath);

  // ---------------------------------
  // Smooth curve
  // ---------------------------------

  let pathData =
    `M ${points[0].x} ${points[0].y}`;

  for (let i = 1; i < points.length; i++) {

    const previous =
      points[i - 1];

    const current =
      points[i];

    const midpointX =
      (previous.x + current.x) / 2;

    pathData +=
      ` C ${midpointX} ${previous.y},
           ${midpointX} ${current.y},
           ${current.x} ${current.y}`;
  }

  const path =
    document.createElementNS(
      "http://www.w3.org/2000/svg",
      "path"
    );

  path.setAttribute(
    "d",
    pathData
  );

  path.classList.add(
    "curve-line"
  );

  svg.appendChild(path);

  // ---------------------------------
  // Points + tooltips
  // ---------------------------------

  points.forEach(point => {

    const circle =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "circle"
      );

    circle.setAttribute(
      "cx",
      point.x
    );

    circle.setAttribute(
      "cy",
      point.y
    );

    circle.setAttribute(
      "r",
      4
    );

    circle.classList.add(
      "curve-point"
    );

    circle.addEventListener(
      "mouseenter",
      event => {

        tooltip.textContent =
          `${point.month}: ${formatNumber(point.value)}`;

        tooltip.classList.add(
          "visible"
        );

        const rect =
          chart.getBoundingClientRect();

        tooltip.style.left =
          `${event.clientX - rect.left + 10}px`;

        tooltip.style.top =
          `${event.clientY - rect.top - 32}px`;
      }
    );

    circle.addEventListener(
      "mousemove",
      event => {

        const rect =
          chart.getBoundingClientRect();

        tooltip.style.left =
          `${event.clientX - rect.left + 10}px`;

        tooltip.style.top =
          `${event.clientY - rect.top - 32}px`;
      }
    );

    circle.addEventListener(
      "mouseleave",
      () => {
        tooltip.classList.remove(
          "visible"
        );
      }
    );

    svg.appendChild(circle);
  });

  // ---------------------------------
  // Month labels
  // ---------------------------------

  points.forEach(point => {

    const label =
      document.createElementNS(
        "http://www.w3.org/2000/svg",
        "text"
      );

    label.setAttribute(
      "x",
      point.x
    );

    label.setAttribute(
      "y",
      height - 10
    );

    label.setAttribute(
      "text-anchor",
      "middle"
    );

    label.classList.add(
      "curve-month-label"
    );

    label.textContent =
      point.month;

    svg.appendChild(label);
  });

  chart.appendChild(svg);

  yearChart.appendChild(chart);
}

/* --------------------------------------------------
   Release Age
-------------------------------------------------- */

// function renderReleaseAge() {

//   const data =
//     getCurrentData();

//   const releaseAge =
//     data.release_age || {};

//   releaseAgeValue.textContent =
//     releaseAge.average != null
//       ? Number(
//           releaseAge.average
//         ).toFixed(1)
//       : "—";


//   /*
//    * This will start displaying automatically
//    * once generate_stats.py adds:
//    *
//    * average_release_year
//    */

//   releaseYearValue.textContent =
//     releaseAge.average_release_year != null
//       ? Number(
//           releaseAge.average_release_year
//         ).toFixed(1)
//       : "—";


//   releaseAgeCount.textContent =
//     releaseAge.entries_with_data
//       ? `${formatNumber(
//           releaseAge.entries_with_data
//         )} entries with release data`
//       : "";
// }


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

  // renderReleaseAge();

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