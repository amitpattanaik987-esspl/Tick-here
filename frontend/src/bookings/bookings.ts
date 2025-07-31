import { loadNavbar } from "../components/navbar/navbar.js";
import { loadFooter } from "../components/footer/footer.js";
import { loadContactModal } from "../components/contact-modal/contactModal.js";
import { loadLocationModal } from "../components/location-modal/locationModal.js";
import { renderTagCategories } from "../components/category/tagCategorySection.js";
import { loadBookedTicketCard } from "../components/ticket-card/ticketCard.js";
import {
  initLoader,
  showLoader,
  hideLoader,
} from "../components/loader/loader.js";

// Main async function to handle flow
async function main(): Promise<void> {
  if (!localStorage.getItem("auth-token")) {
    alert("Please login first");
    window.location.href = "/login";
    return;
  }

  // Initialize loader
  await initLoader();
  showLoader();

  // Load UI components
  document.addEventListener("DOMContentLoaded", async () => {
    loadNavbar();
    loadFooter();
    loadContactModal();
    loadLocationModal();
    renderTagCategories(".tag-category-grid");
  });

  // Get user ID
  const userDetails = localStorage.getItem("User_details");
  const user = userDetails ? JSON.parse(userDetails) : null;
  const userId = user?.id;

  // Ticket sections
  const bookedSection = document.getElementById("booked_ticket_section")!;
  const cancelledSection = document.getElementById("cancelled_ticket_section")!;
  const historySection = document.getElementById("ticket_history_section")!;
  bookedSection.innerHTML = "";
  cancelledSection.innerHTML = "";
  historySection.innerHTML = "";

  try {
    const res = await fetch("http://127.0.0.1:8000/api/gettickets", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
      },
      body: JSON.stringify({ userid: userId }),
    });

    const data = await res.json();
    console.log("Tickets:", data);

    if (data.success && Array.isArray(data.tickets)) {
      const now = new Date();


      await Promise.all(
        data.tickets.map(async (ticket: any) => {
          const ticketId = ticket.ticket_id;

          const eventRes = await fetch(
            "http://127.0.0.1:8000/api/getEventByTicketId",
            {
              method: "POST",
              headers: {
                "content-type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
              },
              body: JSON.stringify({ ticket_id: ticketId }),
            }
          );

          const eventData = await eventRes.json();

          if (eventData.success) {
            const event = eventData.event;
            const eventVenue = eventData.event_venue_details;
            const eventDate = new Date(eventVenue.start_datetime);
            const { day, month, time } = formatDate(eventVenue.start_datetime);

            let targetSectionId = "";

            if (ticket.status?.toLowerCase() === "cancelled") {
              targetSectionId = "cancelled_ticket_section";
            } else if (eventDate < now) {
              targetSectionId = "ticket_history_section";
            } else {
              targetSectionId = "booked_ticket_section";
            }

            await loadBookedTicketCard(targetSectionId, {
              id: ticketId,
              date: day,
              month: month,
              start_time: time,
              title: event.title,
              seats: Array.isArray(ticket.seats) ? ticket.seats : [],
              venue: eventVenue.venue?.venue_name || "N/A",
              price: (ticket.price ?? 0).toString(),
              thumbnail: event.thumbnail.startsWith("http")
                ? event.thumbnail
                : `http://127.0.0.1:8000/storage/${event.thumbnail}`,
              category: event.category.name,
              duration: event.duration,
              status: ticket.status,
            });
          }
        })
      );
    }
  } catch (error) {
    console.error("Error fetching tickets:", error);
  } finally {
    hideLoader();
  }
}

// Utility: Date formatter
function formatDate(datetime: string): {
  day: string;
  month: string;
  time: string;
} {
  const date = new Date(datetime);
  const day = date.getDate().toString().padStart(2, "0");
  const month = date
    .toLocaleString("default", { month: "short" })
    .toUpperCase();
  const time = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
  return { day, month, time };
}

// Run when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  main();
});
