import { loadNavbar } from "../components/navbar/navbar.js";

loadNavbar();

interface TicketData {
    id: number;
    title: string;
    thumbnail: string;
    date: string;
    category: string;
    venue: string;
    seats: string[];
    price: number;
    start_time?: string;
    duration: string;
}

// Fetch ticket from localStorage
const raw = localStorage.getItem("selected_ticket");
let ticket: TicketData | null = null;

try {
    if (!raw) throw new Error("Ticket not found in localStorage.");
    ticket = JSON.parse(raw) as TicketData;
    localStorage.removeItem("selected_ticket");
} catch (error) {
    alert("No ticket found");
    window.location.href = "/";
}

if (ticket) {
    const thumbnail = document.getElementById("ticket-thumbnail") as HTMLImageElement | null;
    const title = document.getElementById("ticket-title");
    const venue = document.getElementById("ticket-venue");
    const seats = document.getElementById("ticket-seats");
    const qty = document.getElementById("ticket-qty");
    const price = document.getElementById("ticket-price");
    const time = document.getElementById("ticket-time");
    const category = document.getElementById("event-category");
    const duration = document.getElementById("event-duration");

    // Assign values if all elements exist
    if (thumbnail && title && venue && seats && qty && price && time && category && duration) {
        thumbnail.src = ticket.thumbnail;
        title.textContent = ticket.title;
        venue.textContent = ticket.venue;
        seats.textContent = ticket.seats.join(", ");
        qty.textContent = ticket.seats.length.toString();
        price.textContent = ticket.price.toString();
        time.textContent = ticket.start_time ?? "6:00 PM";
        category.textContent = ticket.category;
        duration.textContent = ticket.duration;
    }

    // Print button
    const printBtn = document.getElementById("print-ticket");
    printBtn?.addEventListener("click", () => window.print());

    // Cancel button
    const cancelBtn = document.getElementById("cancel-ticket");
    cancelBtn?.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to cancel this ticket?")) return;

        try {
            const res = await fetch("http://127.0.0.1:8000/api/cancel-ticket", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("auth-token")}`,
                },
                body: JSON.stringify({ ticket_id: ticket.id }),
            });

            const result = await res.json();
            if (result.success) {
                alert("Ticket cancelled successfully!");
                window.location.href = "/bookings";
            } else {
                alert(result.message || "Something went wrong");
            }
        } catch (err) {
            console.error("Cancel error:", err);
            alert("Failed to cancel the ticket.");
        }
    });
}
