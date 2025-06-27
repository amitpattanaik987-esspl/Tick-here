import { loadNavbar } from "./components/navbar/navbar.js";
import { loadFooter } from "./components/footer/footer.js";
import { loadContactModal } from "./components/contact-modal/contactModal.js";
import {
  loadLocationModal,
  showSelectedLocationInNavbar,
} from "./components/location-modal/locationModal.js";
import { createEventCard } from "./components/event-card/eventCard.js";
import { renderHomeCategories } from "./components/category/homeCategorySection.js";

declare const Swiper: any;

//get the selected location and fetch events for that location
export function loadEventsForLocation(): void {
  const selected = sessionStorage.getItem("selectedLocation");
  if (!selected) return;

  const location = JSON.parse(selected);
  console.log("Selected location:", location);

  let url = `http://127.0.0.1:8000/api/events/locations/${location.id}`;

  $.ajax({
    url,
    method: "GET",
    success: async function (res: any) {
      const container = $(".event-card-grid");
      container.empty();

      if (!res.data || res.data.length === 0) {
        container.append(
          `<p class="col-span-4 text-center text-gray-500">No events found.</p>`
        );
        return;
      }

      // Wait for all cards to render first
      for (const event of res.data.slice(0, 4)) {
        const cardHtml = await createEventCard(event);
        container.append(cardHtml);
      }

      $(".event-card").on("click", function () {
        const eventId = $(this).data("event-id");

        console.log("Clicked Event ID:", eventId);

        window.location.href = `/events/details/?event=${eventId}`;
      });
    },
    error: function () {
      console.error("Failed to load events.");
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadEventsForLocation();
  showSelectedLocationInNavbar();
  loadLocationModal();
  loadNavbar();
  loadFooter();
  loadContactModal();
  renderHomeCategories(".home-category-grid");

  // Get the "All Events" button by clicking on "see More >""
  const allEvents = document.getElementById("all-events");

  if (allEvents) {
    allEvents.addEventListener("click", () => {
      const currentPath = window.location.pathname;

      if (currentPath.includes("/events")) {
        // Already inside events path, do nothing or maybe refresh
        window.location.href = "/events";
      } else {
        // Go to events from root or relative path
        window.location.href = currentPath.endsWith("/")
          ? currentPath + "events"
          : currentPath + "/events";
      }
    });
  }

  //carousel logic
  const swiper: any = new Swiper(".swiper", {
    loop: true,
    pagination: {
      el: ".swiper-pagination",
    },
    navigation: {
      nextEl: ".swiper-button-next",
      prevEl: ".swiper-button-prev",
    },
    autoplay: {
      delay: 4000,
    },
  });

  //contact modal
  const contactButtons = document.querySelectorAll(".contact-button");
  const modal = document.getElementById("contact-modal") as HTMLDivElement;
  const closeModal = document.getElementById(
    "close-modal"
  ) as HTMLButtonElement;

  contactButtons.forEach((button) => {
    button.addEventListener("click", () => {
      modal.classList.remove("hidden");
      modal.classList.add("flex");
    });
  });

  closeModal.addEventListener("click", () => {
    modal.classList.remove("flex");
    modal.classList.add("hidden");
  });

  // close when clicking outside the modal content
  modal.addEventListener("click", (e: MouseEvent) => {
    if (e.target === modal) {
      modal.classList.remove("flex");
      modal.classList.add("hidden");
    }
  });
});
