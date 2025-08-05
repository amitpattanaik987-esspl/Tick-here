import { loadNavbar } from "./components/admin_navbar/navbar.js";
declare var ApexCharts: any;

function loadEventStats() {
  const token = localStorage.getItem("admin_token");
  console.log("Token:", token);

  if (token === "undefined") {
    window.location.href = "/admin/admin_login/";
    return;
  }

  $.ajax({
    url: "http://127.0.0.1:8000/api/admin/event-stats",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    success: function (response) {
      if (response.success) {
        renderCategoryCards(response.data);
      }
    },
    error: function (xhr, status, error) {
      console.error("Failed to fetch event stats", xhr.responseText);
    },
  });
}

function renderCategoryCards(stats: any) {
  const $section = $("section.grid");
  if ($section.length === 0) return;

  $section.empty(); // Clear existing hardcoded cards

  stats.forEach((item: any) => {
    const trendClass =
      item.growth_percentage >= 0 ? "text-green-500" : "text-red-500";
    const trendSymbol = item.growth_percentage >= 0 ? "↑" : "↓";

    const $card = $(`
      <div class="w-full max-w-[300px] bg-white rounded-lg shadow p-[16px] text-left">
        <div class="flex justify-between items-center mb-2">
          <span class="text-lg font-semibold">${item.category}</span>
          <span class="text-sm text-gray-600">${
            item.this_week_events
          } Active Events</span>
        </div>
        <div class="flex justify-between items-center mb-1">
          <span class="text-4xl font-bold">${item.total_events}</span>
          <span class="text-sm ${trendClass}">${Math.abs(
      item.growth_percentage
    )}% ${trendSymbol}</span>
        </div>
        <p class="text-xs text-gray-500">Event Bookings</p>
      </div>
    `);

    $section.append($card);
  });
}

function loadTicketStats() {
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  $.ajax({
    url: "http://127.0.0.1:8000/api/admin/ticket-stats",
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    success: function (response) {
      if (response.success) {
        console.log(response.data);

        renderCategoryChart(response.data);
      }
    },
    error: function (xhr, status, error) {
      console.error("Failed to fetch ticket stats", xhr.responseText);
    },
  });
}

function renderCategoryChart(data: any[]) {
  const categories = data.map((item) => item.category);
  const ticketCounts = data.map((item) => item.tickets_sold);

  const options = {
    chart: {
      type: "bar",
      height: 260,
      toolbar: { show: false },
      background: "transparent",
      foreColor: "#333",
    },
    grid: {
      show: true,
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        columnWidth: "30%",
        distributed: true,
        dataLabels: {
          position: "middle",
        },
      },
    },

    states: {
      normal: {
        filter: {
          type: "none",
        },
      },
      hover: {
        filter: {
          type: "darken",
          value: 1,
        },
      },
      active: {
        filter: {
          type: "none",
        },
      },
    },
    fill: {
      type: "solid",
      colors: [
        "#bcb1d5",
        "#8f7db9",
        "#685596",
        "#483672",
        "#271551",
        "#0c0420",
      ],
    },
    tooltip: {
      theme: "light",
    },

    dataLabels: {
      enabled: false,
      formatter: (val: number) => val.toString(),
      offsetY: -12,
      style: {
        fontSize: "12px",

        colors: ["#45006E"],
      },
    },
    series: [
      {
        name: "Tickets Sold",
        data: ticketCounts,
      },
    ],
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: "12px",
          colors: "#6B7280",
        },
      },
      axisTicks: { show: false },
      axisBorder: { show: false },
    },
    yaxis: {
      show: true,
    },
  };

  const chart = new ApexCharts(document.querySelector("#myChart"), options);
  chart.render();
}

function getWeekRangeString(date: Date = new Date()): string {
  const current = new Date(date);
  const day = current.getDay(); // Sunday = 0, Monday = 1, ..., Saturday = 6

  // Calculate Monday of current week
  const diffToMonday = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diffToMonday));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const formatOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };

  const start = monday.toLocaleDateString("en-US", formatOptions);
  const end = sunday.toLocaleDateString("en-US", formatOptions);
  const year = sunday.getFullYear();

  return `(${start} – ${end}), ${year}`;
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();

  // check the admin logged in or not
  const adminToken = localStorage.getItem("admin_token");

  if (!adminToken) {
    // Redirect to login page if not logged in
    window.location.href = "/admin/admin_login/";
    return;
  }

  // If token is present, proceed to load dashboard

  // Load event stats
  loadEventStats();

  // load ticket stats
  loadTicketStats();

  // create event page logic

  const createEventButton = document.getElementById("addEventButton");
  if (createEventButton) {
    createEventButton.addEventListener("click", () => {
      window.location.href = "/admin/create_event/";
    });
  }

  // manage event page logic
  const manageEventButton = document.getElementById("manageEventButton");
  if (manageEventButton) {
    manageEventButton.addEventListener("click", () => {
      window.location.href = "/admin/manage-event/";
    });
  }

  // show the weak range
  const weekRangeSpan = document.getElementById("week-range");
  if (weekRangeSpan) {
    weekRangeSpan.textContent = getWeekRangeString();
  }
});
