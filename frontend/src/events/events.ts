import { loadNavbar } from "../components/navbar/navbar.js";
import { loadFooter } from "../components/footer/footer.js";
import { loadContactModal } from "../components/contact-modal/contactModal.js";
import { loadLocationModal } from "../components/location-modal/locationModal.js";
import { renderTagCategories } from "../components/category/tagCategorySection.js";
import { createEventCard } from "../components/event-card/eventCard.js";
import {
  initLoader,
  showLoader,
  hideLoader,
} from "../components/loader/loader.js";
initLoader();

// Linear search function for events by title
function linearSearch(events: any[], searchTerm: string): any[] {
  const results: any[] = [];

  for (let i = 0; i < events.length; i++) {
    const title = events[i].title.toLowerCase();
    if (title.includes(searchTerm.toLowerCase())) {
      results.push(events[i]);
    }
  }

  return results;
}

export function loadEventsForEventsPage(
  selectedCategories: string[] = [],
  searchTerm: string = ""
): void {
  const selected = sessionStorage.getItem("selectedLocation");
  if (!selected) return;

  const location = JSON.parse(selected);

  showLoader();

  $.ajax({
    url: `http://127.0.0.1:8000/api/events/locations/${location.id}`,
    method: "GET",
    success: async function (res: any) {
      const allContainer = $("section:has(h2:contains('All Events')) .grid");
      const upcomingContainer = $(
        "section:has(h2:contains('Upcoming Events')) .grid"
      );

      allContainer.empty();
      upcomingContainer.empty();

      // Apply category filter first
      let filteredEvents = res.data.filter((event: any) => {
        return (
          selectedCategories.length === 0 ||
          selectedCategories.includes(event.category)
        );
      });

      // Apply linear search filter on event title
      if (searchTerm.trim()) {
        filteredEvents = linearSearch(filteredEvents, searchTerm);
      }

      //to track the count of events
      let allEventsCount = 0;
      let upcomingEventsCount = 0;

      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);


      for (const event of filteredEvents) {
        const startDate = new Date(event.start_datetime);

        const status = startDate > oneMonthLater ? "upcoming" : "ongoing";

        const cardHtml = await createEventCard(event, status);

        allContainer.append(cardHtml); // Always show in "All Events"
        allEventsCount++;

        // Show in "Upcoming" only if it's more than 1 month from now
        if (startDate > oneMonthLater) {
          upcomingContainer.append(cardHtml);
          upcomingEventsCount++;
        }
      }

      // navigates to the event details page
      $(".event-page-grid .event-card").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const eventId = $(this).data("event-id");

        const status = $(this).data("status");

        if (status === "ongoing") {
          window.location.href = `details/?event=${eventId}`;
        } else {
          alert("This event booking has not yet started.");
        }
      });

      // If no events matched
      if (allEventsCount === 0) {
        allContainer.append(`
          <div class="col-span-full text-center text-gray-600 text-lg py-10">
            <i class="fa-regular fa-face-frown text-3xl text-purple-600 mb-4"></i>
            <p>No events found for selected category.</p>
          </div>
        `);
      }

      if (upcomingEventsCount === 0) {
        upcomingContainer.append(`
          <div class="col-span-full text-center text-gray-600 text-lg py-10">
            <i class="fa-regular fa-calendar-xmark text-3xl text-purple-600 mb-4"></i>
            <p>No upcoming events available at the moment.</p>
          </div>
        `);
      }
      hideLoader();
    },
    error: function () {
      console.error("Failed to load events.");
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadLocationModal();
  loadNavbar();
  loadFooter();
  loadContactModal();

  renderTagCategories(".tag-category-grid", () => {
    //filtering by category
    const filters =
      document.querySelectorAll<HTMLDivElement>(".category-filter");

    //extract the category param values from the url and store them in a selectedCategories array(stack)
    const params = new URLSearchParams(window.location.search);
    let selectedCategories: string[] = params.getAll("category");

    // check if any category is selected from the home page . if yes then 1st add it in the selectedCategories stack and change the url and then remove it from the session storage
    const rawCategory = sessionStorage.getItem("selectedCategory");
    const fromHome = rawCategory ? JSON.parse(rawCategory) : null;

    const searchInput = document.getElementById(
      "search-input"
    ) as HTMLInputElement;

    let currentSearch = "";

    if (searchInput) {
      searchInput.addEventListener("input", () => {
        currentSearch = searchInput.value;

        loadEventsForEventsPage(selectedCategories, currentSearch);
      });
    }

    if (fromHome && !selectedCategories.includes(fromHome)) {
      selectedCategories.push(fromHome);
      const url = new URL(window.location.href);
      url.searchParams.append("category", fromHome);
      window.history.replaceState({}, "", url.toString());
      sessionStorage.removeItem("selectedCategory"); // Use it only once
    }

    //add the category in the selectedCategories array(stack) when the category button is clicked else remove from the stack. then update the url,activestyle,event listing .
    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        const category = btn.dataset.category;
        if (!category) return;

        if (category.toLowerCase() === "all") {
          selectedCategories = [];
        } else {
          const index = selectedCategories.indexOf(category);
          if (index > -1) {
            selectedCategories.splice(index, 1);
          } else {
            selectedCategories.push(category);
          }
        }

        updateURL();
        applyActiveStyles();
        loadEventsForEventsPage(selectedCategories, currentSearch);
      });
    });

    function updateURL(): void {
      const url = new URL(window.location.href);
      url.searchParams.delete("category");

      selectedCategories.forEach((cat) =>
        url.searchParams.append("category", cat)
      );

      window.history.pushState({}, "", url.toString());
    }

    function applyActiveStyles(): void {
      filters.forEach((btn) => {
        const category = btn.dataset.category || "";
        const isActive =
          (category.toLowerCase() === "all" &&
            selectedCategories.length === 0) ||
          selectedCategories.includes(category);

        btn.classList.toggle("category-active", isActive);
      });
    }

    applyActiveStyles();
    loadEventsForEventsPage(selectedCategories, currentSearch);
  });
});
