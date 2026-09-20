let stats = null;
let selectedDatabase = "all";

const DB_COLORS = {
  video_games: "var(--db-video-games)",
  games: "var(--db-games)",
  reads: "var(--db-reads)",
  multimedia: "var(--db-multimedia)",
  music: "var(--db-music)"
};

const DB_NAMES = {
  video_games: "Video Games",
  games: "Games",
  reads: "Reads",
  multimedia: "Multimedia",
  music: "Music"
};


const databaseSelect =
  document.getElementById("database-select");

const totalNumber =
  document.getElementById("total-number");

const donut =
  document.getElementById("donut");

const databaseLegend =
  document.getElementById("database-legend");

const yearFrom =
  document.getElementById("year-from");

const yearTo =
  document.getElementById("year-to");

const yearChart =
  document.getElementById("year-chart");

const summaryYear =
  document.getElementById("summary-year");

const summaryTotal =
  document.getElementById("summary-total");

const summaryMonths =
  document.getElementById("summary-months");

const summaryAverage =
  document.getElementById("summary-average");

const ratingChart =
  document.getElementById("rating-chart");

const ratingAverage =
  document.getElementById("rating-average");

const releaseAgeValue =
  document.getElementById("release-age-value");

const releaseAgeCount =
  document.getElementById("release-age-count");

const heatmapYear =
  document.getElementById("heatmap-year");

const heatmap =
  document.getElementById("heatmap");

const updated =
  document.getElementById("updated");

const tooltip =
  document.getElementById("tooltip");

const themeToggle =
  document.getElementById("theme-toggle");

const heatmapToggle =
  document.getElementById("heatmap-toggle");

const curveToggle =
  document.getElementById("curve-toggle");

const heatmapView =
  document.getElementById("heatmap-view");

const curveView =
  document.getElementById("curve-view");

const activityDescription =
  document.getElementById("activity-description");


/* ------------------------------
   THEME
------------------------------ */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;

  localStorage.setItem(
    "culture-stats-theme",
    theme
  );
}


function getInitialTheme() {
  const saved =
    localStorage.getItem("culture-stats-theme");

  if (saved === "light" || saved === "dark") {
    return saved;
  }

  return window.matchMedia(
    "(prefers-color-scheme: dark)"
  ).matches
    ? "dark"
    : "light";
}


applyTheme(getInitialTheme());


themeToggle.addEventListener("click", () => {
  const current =
    document.documentElement.dataset.theme;

  applyTheme(
    current === "dark"
      ? "light"
      : "dark"
  );
});


/* ------------------------------
   HELPERS
------------------------------ */

function getCurrentStats() {
  return stats.databases[selectedDatabase];
}


function getYears(databaseStats) {
  return Object.keys(databaseStats.years)
    .map(Number)
    .sort((a, b) => a - b);
}


function formatNumber(value) {
  return Number(value).toLocaleString();
}


function showTooltip(event, text) {
  tooltip.textContent = text;

  tooltip.style.left =
    `${event.clientX}px`;

  tooltip.style.top =
    `${event.clientY}px`;

  tooltip.classList.add("visible");
}


function hideTooltip() {
  tooltip.classList.remove("visible");
}


/* ------------------------------
   DATABASE SELECTOR
------------------------------ */

function setupDatabaseSelector() {

  databaseSelect.innerHTML = "";

  Object.entries(stats.databases)
    .forEach(([key, database]) => {

      const option =
        document.createElement("option");

      option.value = key;
      option.textContent = database.name;

      databaseSelect.appendChild(option);
    });

  databaseSelect.value = "all";
  selectedDatabase = "all";
}


databaseSelect.addEventListener(
  "change",
  () => {

    selectedDatabase =
      databaseSelect.value;

    renderDashboard();
  }
);


/* ------------------------------
   TOTAL / DONUT
------------------------------ */

function renderTotal(databaseStats) {

  totalNumber.textContent =
    formatNumber(databaseStats.total);


  if (selectedDatabase !== "all") {

    donut.style.background =
      "conic-gradient(var(--accent) 0deg 360deg)";

    databaseLegend.innerHTML = "";

    return;
  }


  const breakdown =
    databaseStats.breakdown || {};


  const entries =
    Object.entries(breakdown)
      .filter(([, count]) => count > 0);


  if (!entries.length) {

    donut.style.background =
      "conic-gradient(var(--bar-bg) 0deg 360deg)";

    databaseLegend.innerHTML = "";

    return;
  }


  const total =
    databaseStats.total;


  let currentAngle = 0;

  const gradients = [];


  for (const [key, count] of entries) {

    const angle =
      (count / total) * 360;

    const nextAngle =
      currentAngle + angle;

    gradients.push(
      `${DB_COLORS[key]} ${currentAngle}deg ${nextAngle}deg`
    );

    currentAngle = nextAngle;
  }


  donut.style.background =
    `conic-gradient(${gradients.join(", ")})`;


  databaseLegend.innerHTML = "";


  for (const [key, count] of entries) {

    const item =
      document.createElement("div");

    item.className =
      "legend-item";


    const dot =
      document.createElement("span");

    dot.className =
      "legend-dot";

    dot.style.background =
      DB_COLORS[key];


    const name =
      document.createElement("span");

    name.className =
      "legend-name";

    name.textContent =
      DB_NAMES[key] || key;


    const countElement =
      document.createElement("span");

    countElement.className =
      "legend-count";

    countElement.textContent =
      formatNumber(count);


    item.append(
      dot,
      name,
      countElement
    );

    databaseLegend.appendChild(item);
  }
}


/* ------------------------------
   YEAR RANGE
------------------------------ */

function setupYearSelectors(databaseStats) {

  const years =
    getYears(databaseStats);


  yearFrom.innerHTML = "";
  yearTo.innerHTML = "";


  if (!years.length) {
    yearChart.innerHTML =
      `<div class="chart-empty">No data yet.</div>`;

    return;
  }


  for (const year of years) {

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
  }


  yearFrom.value =
    years[0];

  yearTo.value =
    years[years.length - 1];


  renderYearChart(databaseStats);
}


yearFrom.addEventListener(
  "change",
  () => {

    const databaseStats =
      getCurrentStats();

    renderYearChart(databaseStats);
  }
);


yearTo.addEventListener(
  "change",
  () => {

    const databaseStats =
      getCurrentStats();

    renderYearChart(databaseStats);
  }
);


/* ------------------------------
   CURVED YEAR CHART
------------------------------ */

function renderYearChart(databaseStats) {

  const years =
    getYears(databaseStats);


  let from =
    Number(yearFrom.value);

  let to =
    Number(yearTo.value);


  if (!from || !to) {
    return;
  }


  if (from > to) {
    [from, to] = [to, from];
  }


  const visibleYears =
    years.filter(
      year => year >= from && year <= to
    );


  if (!visibleYears.length) {

    yearChart.innerHTML =
      `<div class="chart-empty">No data for this range.</div>`;

    return;
  }


  const values =
    visibleYears.map(
      year => databaseStats.years[String(year)] || 0
    );


  const width = 1000;
  const height = 300;

  const paddingLeft = 52;
  const paddingRight = 18;
  const paddingTop = 20;
  const paddingBottom = 38;


  const chartWidth =
    width - paddingLeft - paddingRight;

  const chartHeight =
    height - paddingTop - paddingBottom;


  const maxValue =
    Math.max(...values, 1);


  const yMax =
    Math.ceil(maxValue / 5) * 5 || 1;


  function xFor(index) {

    if (visibleYears.length === 1) {
      return paddingLeft + chartWidth / 2;
    }

    return (
      paddingLeft +
      (index / (visibleYears.length - 1)) *
      chartWidth
    );
  }


  function yFor(value) {

    return (
      paddingTop +
      chartHeight -
      (value / yMax) * chartHeight
    );
  }


  const points =
    values.map(
      (value, index) => ({
        x: xFor(index),
        y: yFor(value),
        value,
        year: visibleYears[index]
      })
    );


  /* Grid */

  const gridCount = 5;

  let grid = "";

  for (let i = 0; i <= gridCount; i++) {

    const value =
      (yMax / gridCount) * i;

    const y =
      yFor(value);


    grid += `
      <line
        class="chart-grid-line"
        x1="${paddingLeft}"
        y1="${y}"
        x2="${width - paddingRight}"
        y2="${y}"
      />

      <text
        class="chart-axis-label"
        x="${paddingLeft - 10}"
        y="${y + 4}"
        text-anchor="end"
      >
        ${Math.round(value)}
      </text>
    `;
  }


  /* X labels */

  let labels = "";

  points.forEach(point => {

    labels += `
      <text
        class="chart-axis-label"
        x="${point.x}"
        y="${height - 10}"
        text-anchor="middle"
      >
        ${point.year}
      </text>
    `;
  });


  /* Curved line */

  let linePath = "";

  if (points.length === 1) {

    linePath =
      `M ${points[0].x} ${points[0].y}`;

  } else {

    linePath =
      `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {

      const current =
        points[i];

      const next =
        points[i + 1];

      const dx =
        (next.x - current.x) / 3;


      linePath += `
        C
        ${current.x + dx} ${current.y},
        ${next.x - dx} ${next.y},
        ${next.x} ${next.y}
      `;
    }
  }


  /* Area below line */

  const areaPath =
    `${linePath}
     L ${points[points.length - 1].x} ${paddingTop + chartHeight}
     L ${points[0].x} ${paddingTop + chartHeight}
     Z`;


  /* Points */

  let dots = "";

  points.forEach(point => {

    dots += `
      <circle
        class="chart-dot"
        cx="${point.x}"
        cy="${point.y}"
        r="5"
        data-year="${point.year}"
        data-value="${point.value}"
      />
    `;
  });


  yearChart.innerHTML = `
    <svg
      viewBox="0 0 ${width} ${height}"
      preserveAspectRatio="none"
      aria-label="Entries over time"
    >

      ${grid}

      <path
        class="chart-area"
        d="${areaPath}"
      />

      <path
        class="chart-line"
        d="${linePath}"
      />

      ${dots}

      ${labels}

    </svg>
  `;


  yearChart
    .querySelectorAll(".chart-dot")
    .forEach(dot => {

      dot.addEventListener(
        "mouseenter",
        event => {

          const year =
            event.target.dataset.year;

          const value =
            event.target.dataset.value;

          showTooltip(
            event,
            `${year}: ${formatNumber(value)} entries`
          );
        }
      );


      dot.addEventListener(
        "mousemove",
        event => {

          tooltip.style.left =
            `${event.clientX}px`;

          tooltip.style.top =
            `${event.clientY}px`;
        }
      );


      dot.addEventListener(
        "mouseleave",
        hideTooltip
      );
    });
}


/* ------------------------------
   YEAR SUMMARY
------------------------------ */

function setupSummaryYears(databaseStats) {

  const years =
    getYears(databaseStats);

  summaryYear.innerHTML = "";


  if (!years.length) {
    return;
  }


  years.forEach(year => {

    const option =
      document.createElement("option");

    option.value = year;
    option.textContent = year;

    summaryYear.appendChild(option);
  });


  summaryYear.value =
    years[years.length - 1];


  renderYearSummary(databaseStats);
}


summaryYear.addEventListener(
  "change",
  () => {

    renderYearSummary(
      getCurrentStats()
    );
  }
);


function renderYearSummary(databaseStats) {

  const year =
    summaryYear.value;


  const data =
    databaseStats.year_stats[year];


  if (!data) {

    summaryTotal.textContent = "0";
    summaryMonths.textContent = "0";
    summaryAverage.textContent = "0";

    return;
  }


  summaryTotal.textContent =
    formatNumber(data.total);


  summaryMonths.textContent =
    data.active_months;


  summaryAverage.textContent =
    data.average_per_active_month;
}


/* ------------------------------
   RATINGS
------------------------------ */

function renderRatings(databaseStats) {

  const distribution =
    databaseStats.ratings.distribution;


  const ratings = [
    [5, "★★★★★"],
    [4, "★★★★"],
    [3, "★★★"],
    [2, "★★"],
    [1, "★"],
    [-1, "☆"],
    [-2, "☆☆"],
    [-3, "☆☆☆"],
    [-4, "☆☆☆☆"],
    [-5, "☆☆☆☆☆"]
  ];


  const counts =
    ratings.map(
      ([rating]) =>
        distribution[String(rating)] || 0
    );


  const maxCount =
    Math.max(...counts, 1);


  ratingChart.innerHTML = "";


  ratings.forEach(
    ([rating, label], index) => {

      const count =
        counts[index];


      const percentage =
        (count / maxCount) * 100;


      const row =
        document.createElement("div");

      row.className =
        "rating-row";


      row.innerHTML = `
        <span class="rating-label">
          ${label}
        </span>

        <div class="rating-track">
          <div
            class="rating-fill"
            style="width: ${percentage}%"
          ></div>
        </div>

        <span class="rating-count">
          ${formatNumber(count)}
        </span>
      `;


      ratingChart.appendChild(row);
    }
  );


  const average =
    databaseStats.ratings.average;


  ratingAverage.textContent =
    average === null
      ? "Average: —"
      : `Average: ${average > 0 ? "+" : ""}${average}`;
}


/* ------------------------------
   RELEASE AGE
------------------------------ */

function renderReleaseAge(databaseStats) {

  const age =
    databaseStats.release_age.average;


  if (age === null) {

    releaseAgeValue.textContent =
      "—";

    releaseAgeCount.textContent =
      "No release-date data available.";

    return;
  }


  releaseAgeValue.textContent =
    age;


  releaseAgeCount.textContent =
    `${formatNumber(
      databaseStats.release_age.entries_with_data
    )} entries with release-date data`;
}


/* ------------------------------
   HEATMAP
------------------------------ */

function setupHeatmapYears(databaseStats) {

  const dates =
    Object.keys(databaseStats.heatmap);


  const years =
    [...new Set(
      dates.map(
        date => Number(date.slice(0, 4))
      )
    )].sort(
      (a, b) => a - b
    );


  heatmapYear.innerHTML = "";


  if (!years.length) {
    heatmap.innerHTML = "";
    return;
  }


  years.forEach(year => {

    const option =
      document.createElement("option");

    option.value = year;
    option.textContent = year;

    heatmapYear.appendChild(option);
  });


  heatmapYear.value =
    years[years.length - 1];


  renderHeatmap(databaseStats);
}


heatmapYear.addEventListener(
  "change",
  () => {

    renderHeatmap(
      getCurrentStats()
    );
  }
);


function renderHeatmap(databaseStats) {

  const year =
    Number(heatmapYear.value);


  const dates =
    Object.keys(databaseStats.heatmap)
      .filter(
        date =>
          Number(date.slice(0, 4)) === year
      );


  if (!dates.length) {

    heatmap.innerHTML =
      `<div class="chart-empty">No activity this year.</div>`;

    return;
  }


  const counts =
    dates.map(
      date =>
        databaseStats.heatmap[date]
    );


  const maxCount =
    Math.max(...counts, 1);


  const firstDate =
    new Date(`${year}-01-01T00:00:00`);


  const lastDate =
    new Date(`${year}-12-31T00:00:00`);


  /*
    Monday = 0
    Sunday = 6
  */

  function mondayIndex(date) {

    const day =
      date.getDay();

    return day === 0
      ? 6
      : day - 1;
  }


  const start =
    new Date(firstDate);

  start.setDate(
    start.getDate() -
    mondayIndex(start)
  );


  const end =
    new Date(lastDate);

  end.setDate(
    end.getDate() +
    (6 - mondayIndex(end))
  );


  const cells = [];


  for (
    let date = new Date(start);
    date <= end;
    date.setDate(date.getDate() + 1)
  ) {

    const dateKey =
      date.toISOString().slice(0, 10);


    const count =
      databaseStats.heatmap[dateKey] || 0;


    let level = 0;


    if (count > 0) {

      const ratio =
        count / maxCount;


      if (ratio <= 0.25) {
        level = 1;
      } else if (ratio <= 0.5) {
        level = 2;
      } else if (ratio <= 0.75) {
        level = 3;
      } else {
        level = 4;
      }
    }


    const cell =
      document.createElement("div");

    cell.className =
      `heatmap-cell level-${level}`;


    cell.addEventListener(
      "mouseenter",
      event => {

        showTooltip(
          event,
          `${dateKey}: ${count} ${count === 1 ? "entry" : "entries"}`
        );
      }
    );


    cell.addEventListener(
      "mousemove",
      event => {

        tooltip.style.left =
          `${event.clientX}px`;

        tooltip.style.top =
          `${event.clientY}px`;
      }
    );


    cell.addEventListener(
      "mouseleave",
      hideTooltip
    );


    cells.push(cell);
  }


  heatmap.innerHTML = "";

  cells.forEach(
    cell => heatmap.appendChild(cell)
  );
}

function setActivityView(view) {

  const isHeatmap = view === "heatmap";

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
}


heatmapToggle.addEventListener(
  "click",
  () => setActivityView("heatmap")
);


curveToggle.addEventListener(
  "click",
  () => setActivityView("curve")
);

/* ------------------------------
   DASHBOARD
------------------------------ */

function renderDashboard() {

  const databaseStats =
    getCurrentStats();

  renderTotal(databaseStats);

  setupYearSelectors(databaseStats);

  setupSummaryYears(databaseStats);

  renderRatings(databaseStats);

  renderReleaseAge(databaseStats);

  setupHeatmapYears(databaseStats);

  // Heatmap is the default view.
  setActivityView("heatmap");
}


/* ------------------------------
   LOAD DATA
------------------------------ */

async function loadStats() {

  try {

    const response =
      await fetch(
        `stats.json?t=${Date.now()}`
      );


    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}`
      );
    }


    stats =
      await response.json();


    if (stats.updated_at) {

      const date =
        new Date(stats.updated_at);


      updated.textContent =
        `Updated ${date.toLocaleString()}`;
    }


    setupDatabaseSelector();

    renderDashboard();

  } catch (error) {

    console.error(error);

    updated.textContent =
      "Unable to load statistics.";
  }
}


loadStats();