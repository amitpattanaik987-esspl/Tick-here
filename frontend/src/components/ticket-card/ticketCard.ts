export async function loadBookedTicketCard(containerId: any, data: any) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        const res = await fetch("/components/ticket-card/index.html");
        if (!res.ok) throw new Error("Failed to load ticket card");

        let html = await res.text();

        html = html
            .replace("THUMBNAIL_URL", data.thumbnail)
            .replace("DATE", data.date)
            .replace("MONTH", data.month)
            .replace("EVENT TITLE", data.title)
            .replace("SEATS", data.seats.join(", "))
            .replace("VENUE", data.venue)
            .replace("QTY", data.seats.length)
            .replace("PRICE", data.price)
            .replace("Comedy", data.category);

        const tempWrapper = document.createElement("div");
        tempWrapper.innerHTML = html;
        const ticketElement = tempWrapper.firstElementChild;

        if (ticketElement) {
            if (data.status?.toLowerCase() === "booked") {
                ticketElement.classList.add("cursor-pointer", "hover:opacity-90");
                ticketElement.addEventListener("click", () => {
                    localStorage.setItem("selected_ticket", JSON.stringify(data));
                    window.location.href = `/ticket-detail`;
                });
            } else {
                ticketElement.classList.add("opacity-60", "cursor-not-allowed");
            }

            container.appendChild(ticketElement);
        }
    } catch (err) {
        console.error("Error loading ticket card:", err);
    }
}
