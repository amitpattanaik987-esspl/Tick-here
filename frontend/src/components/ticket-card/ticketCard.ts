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
            .replace("PRICE", data.price);

        const tempWrapper = document.createElement("div");
        tempWrapper.innerHTML = html;
        const ticketElement = tempWrapper.firstElementChild;

        // Attach modal trigger
        if (ticketElement) {
            ticketElement.addEventListener("click", () => {
                openTicketDetailModal({
                    ...data,
                    ticket_id: data.id
                }); // 👈 Step 2
            });
            container.appendChild(ticketElement);
        }
    } catch (err) {
        console.error("Error loading ticket card:", err);
    }
}

function openTicketDetailModal(data: any) {
    console.log(data);

    const existing = document.getElementById("ticket-modal");
    if (existing) existing.remove();

    const modalWrapper = document.createElement("div");
    modalWrapper.id = "ticket-modal";
    modalWrapper.className = `
        fixed inset-0 z-50 flex items-center justify-center 
        bg-black bg-opacity-20 backdrop-blur-sm
    `;

    const modalContent = document.createElement("div");
    modalContent.id = "ticket-modal-content"; // For printing only this
    modalContent.className = `
        bg-white rounded-lg shadow-lg w-[90%] max-w-[600px] p-6 relative text-black
    `;

    modalContent.innerHTML = `
        <button id="close-ticket-modal" class="absolute top-2 right-2 text-xl font-bold text-gray-700">&times;</button>
        <h2 class="text-2xl font-bold mb-2">${data.title}</h2>
        <img src="${data.thumbnail}" class="w-full max-h-[300px] object-contain rounded-lg mb-4" />
        <p><strong>Date:</strong> ${data.date} ${data.month}</p>
        <p><strong>Time:</strong> ${data.start_time ?? '6:00 PM'}</p>
        <p><strong>Venue:</strong> ${data.venue}</p>
        <p><strong>Seats:</strong> ${data.seats.join(", ")}</p>
        <p><strong>Price:</strong> ₹${data.price}</p>

        

        <div class="text-right mt-4">
            <button id="print-ticket" class="bg-purple-700 text-white px-4 py-2 rounded hover:bg-purple-800">
                Print Ticket
            </button>
            <button id="cancel-ticket-btn" class="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
                Cancel Ticket
            </button>
        </div>
    `;

    modalWrapper.appendChild(modalContent);
    document.body.appendChild(modalWrapper);
    document.body.style.overflow = "hidden";

    // Close modal
    document.getElementById("close-ticket-modal")?.addEventListener("click", () => {
        modalWrapper.remove();
        document.body.style.overflow = "";
    });

    modalWrapper.addEventListener("click", (e) => {
        if (e.target === modalWrapper) {
            modalWrapper.remove();
            document.body.style.overflow = "";
        }
    });

    // 🖨️ Print handler
    document.getElementById("print-ticket")?.addEventListener("click", () => {
        const modalContent = document.getElementById("ticket-modal-content");
        if (!modalContent) return;

        const printWindow = window.open("", "", "width=800,height=600");
        if (!printWindow) return;

        printWindow.document.write(`
            <html>
                <head>
                    <title>Print Ticket</title>
                    <link href="/assets/styles/output.css" rel="stylesheet">
                </head>
                <body class="p-4 font-sans">
                    ${modalContent.innerHTML}
                </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();

        setTimeout(() => {
            printWindow.print();
            printWindow.close();
        }, 500);
    });

    document.getElementById("cancel-ticket-btn")?.addEventListener("click", async () => {
        if (!confirm("Are you sure you want to cancel this ticket?")) return;

        const res = await fetch("http://127.0.0.1:8000/api/cancel-ticket", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ ticket_id: data.id })
        });

        const result = await res.json();
        if (result.success) {
            alert("Ticket cancelled successfully!");
            modalWrapper.remove();
            document.body.style.overflow = "";
            location.reload();
        } else {
            alert(result.message || "Something went wrong");
        }

    });
}
