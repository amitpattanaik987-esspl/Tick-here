import { loadNavbar } from "./components/navbar/navbar.js";
import { loadFooter } from "./components/footer/footer.js";
import { loadContactModal } from "./components/contact-modal/contactModal.js";
import { loadLocationModal } from "./components/location-modal/locationModal.js";
import { createEventCard } from "./components/event-card/eventCard.js";
import { renderHomeCategories } from "./components/category/homeCategorySection.js";
import {
  initLoader,
  hideLoader,
  showLoader,
} from "./components/loader/loader.js";

initLoader();

declare const Swiper: any;

//get the selected location and fetch events for that location
export function loadEventsForLocation(): void {
  const selected = sessionStorage.getItem("selectedLocation");
  if (!selected) return;

  const location = JSON.parse(selected);

  showLoader();

  let url = `http://127.0.0.1:8000/api/events/locations/${location.id}`;

  $.ajax({
    url,
    method: "GET",
    success: async function (res: any) {
      const container = $(".home-event-card-grid");
      container.empty();
      hideLoader();

      if (!res.data || res.data.length === 0) {
        container.append(
          `<p class="col-span-4 text-center text-gray-500">No events found.</p>`
        );
        return;
      }

      const now = new Date();
      const oneMonthLater = new Date();
      oneMonthLater.setMonth(now.getMonth() + 1);

      let displayedCount = 0;

      for (const event of res.data) {
        const startDate = new Date(event.start_datetime);
        const status = startDate > oneMonthLater ? "upcoming" : "ongoing";

        // Show only the first 4 ongoing events
        if (status === "ongoing" && displayedCount < 4) {
          const cardHtml = await createEventCard(event, status);
          container.append(cardHtml);
          displayedCount++;
        }

        if (displayedCount >= 4) break;
      }

      if (displayedCount === 0) {
        container.append(
          `<p class="col-span-4 text-center text-gray-500">No ongoing events found.</p>`
        );
      }

      $(".home-event-card-grid .event-card").on("click", function (e) {
        e.preventDefault();
        e.stopPropagation();

        const eventId = $(this).data("event-id");

        const status = $(this).data("status");

        if (status === "ongoing") {
          window.location.href = `/events/details/?event=${eventId}`;
        }
      });
    },
    error: function () {
      console.error("Failed to load events.");
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadEventsForLocation();
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

  // Newsletter form handling
  const subscribeButton = document.getElementById(
    "submitNewsletterBtn"
  ) as HTMLButtonElement;

  if (subscribeButton) {
    subscribeButton.addEventListener("click", function (e) {
      e.preventDefault();

      const email = $("#newsletter-email").val() as string;
      const originalText = subscribeButton.innerHTML;

      if (!email) {
        alert("Please enter an email address.");
        return;
      }

      console.log(subscribeButton);

      // Disable button and change text
      subscribeButton.disabled = true;
      subscribeButton.innerHTML = `<b
                class="w-[8.813rem] relative text-white text-center px-2 text-lg"
                ><i class="fa-solid fa-circle-notch fa-spin mr-2"></i>Subscribing...</b>`;

      $.ajax({
        url: "http://127.0.0.1:8000/api/subscribe/",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        data: JSON.stringify({ email }),
        success: function (response) {
          alert(response.message);
          $("#newsletter-email").val("");
        },
        error: function (xhr) {
          const message = xhr.responseJSON?.message || "Something went wrong!";
          alert(message);
        },
        complete: function () {
          // Re-enable button and restore text
          subscribeButton.disabled = false;
          subscribeButton.innerHTML = originalText;
        },
      });
    });
  } else {
    console.warn("Newsletter button not found in DOM");
  }

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
