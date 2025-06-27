import { loadNavbar } from "../components/navbar/navbar.js";
import { loadFooter } from "../components/footer/footer.js";
import { loadContactModal } from "../components/contact-modal/contactModal.js";
import { loadLocationModal } from "../components/location-modal/locationModal.js";
import { renderTagCategories } from "../components/category/tagCategorySection.js";
import { loadBookedTicketCard } from "../components/ticket-card/ticketCard.js";

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  loadFooter();
  loadContactModal();
  loadLocationModal();
  renderTagCategories(".tag-category-grid");

  // Category Filtering
  const filters = document.querySelectorAll<HTMLDivElement>(".category-filter");
  const params = new URLSearchParams(window.location.search);
  let selectedCategories: string[] = params.getAll("category");

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
        (category.toLowerCase() === "all" && selectedCategories.length === 0) ||
        selectedCategories.includes(category);
      btn.classList.toggle("category-active", isActive);
    });
  }

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
      // TODO: fetchEventsByCategories(selectedCategories);
    });
  });

  applyActiveStyles();

  // 🎟️ Ticket Load Logic
  const userdetails = localStorage.getItem("User_details");
  const user = userdetails ? JSON.parse(userdetails) : null;
  const userid = user?.id;

  const bookedSection = document.getElementById("booked_ticket_section")!;
  const cancelledSection = document.getElementById("cancelled_ticket_section")!;
  const historySection = document.getElementById("ticket_history_section")!;

  bookedSection.innerHTML = "";
  cancelledSection.innerHTML = "";
  historySection.innerHTML = "";

  fetch("http://127.0.0.1:8000/api/gettickets", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({ userid: userid }),
  })
    .then((res) => res.json())
    .then((data) => {
      console.log("Tickets:", data);

      if (data.success && Array.isArray(data.tickets)) {
        const now = new Date();

        data.tickets.forEach((ticket) => {
          const ticket_id = ticket.ticket_id;

          fetch("http://127.0.0.1:8000/api/getEventByTicketId", {
            method: "POST",
            headers: {
              "content-type": "application/json",
            },
            body: JSON.stringify({ ticket_id }),
          })
            .then((res) => res.json())
            .then((eventData) => {
              if (eventData.success) {
                const event = eventData.event;
                const eventVenue = eventData.event_venue_details;
                const eventDate = new Date(eventVenue.start_datetime);
                const { day, month, time } = formatDate(eventVenue.start_datetime);

                // Determine target section
                let targetSectionId = "";

                if (ticket.status?.toLowerCase() === "cancelled") {
                  targetSectionId = "cancelled_ticket_section";
                } else if (eventDate < now) {
                  targetSectionId = "ticket_history_section";
                } else {
                  targetSectionId = "booked_ticket_section";
                }

                loadBookedTicketCard(targetSectionId, {
                  id: ticket_id,
                  date: day,
                  month: month,
                  start_time: time,
                  title: event.title,
                  seats: Array.isArray(ticket.seats) ? ticket.seats : [],
                  venue: eventVenue.venue?.venue_name || "N/A",
                  price: (ticket.price ?? 0).toString(),
                  thumbnail: event.thumbnail || "/assets/images/event-small-poster.jpg",
                });
              }
            });
        });
      }
    })
    .catch((err) => {
      console.error("Error fetching tickets:", err);
    });

  function formatDate(datetime: string): { day: string; month: string; time: string } {
    const date = new Date(datetime);
    const day = date.getDate().toString().padStart(2, "0");
    const month = date.toLocaleString("default", { month: "short" }).toUpperCase();
    const time = date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return { day, month, time };
  }
