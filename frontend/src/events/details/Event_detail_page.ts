import { loadNavbar } from "../../components/navbar/navbar.js";
import { loadFooter } from "../../components/footer/footer.js";
import { loadContactModal } from "../../components/contact-modal/contactModal.js";
import { loadLocationModal } from "../../components/location-modal/locationModal.js";

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();
  loadFooter();
  loadContactModal();
  loadLocationModal();
});

const urlParameter = new URLSearchParams(window.location.search);
const event_Id = urlParameter.get("event");

const payment_button = document.getElementById("payment-button");

interface Seat {
  id: number;
  seat_no: number;
  label: string;
  price: string;
  is_booked?: boolean;
}

class ListNode<T> {
  value: T;
  next: ListNode<T> | null = null;

  constructor(value: T) {
    this.value = value;
  }
}

class LinkedList<T> {
  head: ListNode<T> | null = null;
  private _size: number = 0;

  get size(): number {
    return this._size;
  }

  add(value: T) {
    const node = new ListNode(value);
    if (!this.head) {
      this.head = node;
    } else {
      let current = this.head;
      while (current.next) current = current.next;
      current.next = node;
    }
    this._size++;
  }

  remove(value: T) {
    if (!this.head) return;

    if (this.head.value === value) {
      this.head = this.head.next;
      this._size--;
      return;
    }

    let current = this.head;
    while (current.next && current.next.value !== value) {
      current = current.next;
    }

    if (current.next) {
      current.next = current.next.next;
      this._size--;
    }
  }

  toArray(): T[] {
    const result: T[] = [];
    let current = this.head;
    while (current) {
      result.push(current.value);
      current = current.next;
    }
    return result;
  }
}

const selectedSeats = new LinkedList<string>();

declare var Stripe: any;

const stripe = Stripe(
  "pk_test_51RbHaeHBa8sjr9k4JHp8VJ5uUgLSbkZsMlMvmjQnInpNhFV77x5cTJJVNInFQqJAHEBrCScxUVURFfKn0OHlN0mx008GD1wiuq"
);

let event_detail: any;

if (event_Id) {
  const apiUrl = `http://127.0.0.1:8000/api/events/${event_Id}`;

  fetch(apiUrl)
    .then((res) => {
      if (!res.ok) {
        alert("Failed to fetch event details");
        window.location.href = "http://127.0.0.1:8080/";
      }

      return res.json();
    })
    .then((data) => {
      if (!data.success) throw new Error("Event fetch unsuccessful");

      const event = data.payload;
      console.log(event);
      event_detail = event;
      (document.getElementById("event-title") as HTMLElement).textContent =
        event.title;
      (document.getElementById("event-duration") as HTMLElement).textContent =
        formatDuration(event.duration);
      (
        document.getElementById("event-description") as HTMLElement
      ).textContent = event.description;
      (document.getElementById("event_category") as HTMLElement).textContent =
        event.category.name + " Show";
      (document.getElementById("event-price") as HTMLElement).textContent =
        "400.00";
      let num_of_venues = event.event_venue.length;

      const venue_div = document.getElementById("Venues_div");
      const show_time_div = document.getElementById("show_time_div");
      const date_div = document.getElementById("date_div");

      for (let index = 0; index < num_of_venues; index++) {
        // Adding venues here
        const venue = document.createElement("p");
        venue.className =
          "bg-[#EAE2FF] rounded-[10px] px-[30px] py-[10px] w-[377px] text-center border-[1px] cursor-pointer";
        venue.addEventListener("click", function () {
          document.querySelectorAll("#Venues_div .selected").forEach((el) => {
            el.classList.remove("selected");
          });

          venue.classList.add("selected");

          const selectedVenueId = event.event_venue[index].venue.id;
          fetchAndRenderSeats(selectedVenueId);
        });
        venue.textContent = event.event_venue[index].venue.venue_name;
        venue_div?.appendChild(venue);

        //respective dates here
        const date = document.createElement("p");
        date.className =
          "bg-[#EAE2FF] rounded-[10px] px-[34px] py-[10px] w-[200px] text-center border-[1px] cursor-pointer";
        date.addEventListener("click", function () {
          document.querySelectorAll("#date_div .selected").forEach((el) => {
            el.classList.remove("selected");
          });

          date.classList.add("selected");
        });
        date.textContent = extractDateLabel(
          event.event_venue[index].start_datetime
        );
        date_div?.appendChild(date);

        //respective times here
        const time = document.createElement("p");
        time.className =
          "bg-[#EAE2FF] rounded-[10px] px-[34px] py-[10px] w-[320px] text-center border-[1px] cursor-pointer";
        time.addEventListener("click", function () {
          document
            .querySelectorAll("#show_time_div .selected")
            .forEach((el) => {
              el.classList.remove("selected");
            });

          time.classList.add("selected");
        });
        time.textContent = extractTime(event.event_venue[index].start_datetime);
        show_time_div?.appendChild(time);
      }

      (venue_div?.firstElementChild as HTMLElement)?.classList.add("selected");
      (date_div?.firstElementChild as HTMLElement)?.classList.add("selected");
      (show_time_div?.firstElementChild as HTMLElement)?.classList.add(
        "selected"
      );

      if (event.event_venue.length > 0) {
        const selectedVenueId = event.event_venue[0].venue.id;
        fetchAndRenderSeats(selectedVenueId);
      }

      const imagePath = `http://127.0.0.1:8000/storage/${event.thumbnail}`;
      const thumbnail = document.getElementById(
        "event-thumbnail"
      ) as HTMLImageElement;
      thumbnail.src = event.thumbnail;
      thumbnail.alt = event.title;
    })
    .catch((err) => {
      console.error("Error loading event:", err);
    });
} else {
  console.warn("No event ID found in URL.");
}

function formatDuration(durationStr: string): string {
  const hours = parseInt(durationStr.split(":")[0], 10);
  return `${hours} Hrs`;
}

function extractTime(datetimeStr: string): string {
  const date = new Date(datetimeStr.replace(" ", "T")); // Ensure it's in ISO format
  const hours = date.getHours();
  const minutes = date.getMinutes();

  const ampm = hours >= 12 ? "PM" : "AM";
  const hour12 = hours % 12 || 12;
  const paddedMinutes = minutes.toString().padStart(2, "0");

  return `${hour12}:${paddedMinutes} ${ampm}`;
}

function extractDateLabel(datetimeStr: string): string {
  const inputDate = new Date(datetimeStr.replace(" ", "T"));
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  // Reset time for accurate date comparison
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  if (inputDate.getTime() === today.getTime()) {
    return "Today";
  } else if (inputDate.getTime() === tomorrow.getTime()) {
    return "Tomorrow";
  } else {
    const options: Intl.DateTimeFormatOptions = {
      weekday: "short",
      day: "2-digit",
      month: "short",
    };
    return inputDate.toLocaleDateString("en-US", options); // e.g. "Wed, 18 Jun"
  }
}

function fetchAndRenderSeats(venueId: number) {
  fetch(`http://127.0.0.1:8000/api/venues/${venueId}/seats`)
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load seats");
      return res.json();
    })
    .then((data) => {
      if (!data.success) throw new Error("Seat fetch unsuccessful");

      const seatContainer = document.querySelector(".seat-grid");
      seatContainer!.innerHTML = "";

      const selectedSeatsDisplay = document.getElementById("selected_seats");
      const finalPriceDisplay = document.getElementById("final_price");

      // Group seats by row_label
      const seatsByRow: { [row: string]: Seat[] } = {};
      data.seats.forEach((seat: Seat) => {
        const row = seat.label.match(/^[A-Z]+/g)?.[0] || "";
        if (!seatsByRow[row]) seatsByRow[row] = [];
        seatsByRow[row].push(seat);
      });

      const sortedRows = Object.keys(seatsByRow).sort((a, b) => {
        return a.length - b.length || a.localeCompare(b);
      });

      sortedRows.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.className =
          "flex gap-[10px] justify-center items-center mb-[10px]";

        const rowLabel = document.createElement("span");
        rowLabel.className = "w-[40px] text-right mr-[10px] font-semibold";
        rowLabel.textContent = row;
        rowDiv.appendChild(rowLabel);

        // Split row into two segments
        const totalSeats = seatsByRow[row].length;
        const halfIndex = Math.ceil(totalSeats / 2);
        const leftSeats = seatsByRow[row].slice(0, halfIndex);
        const rightSeats = seatsByRow[row].slice(halfIndex);

        const leftDiv = document.createElement("div");
        leftDiv.className = "flex gap-[5px]";

        const rightDiv = document.createElement("div");
        rightDiv.className = "flex gap-[5px]";

        // Helper to create seat DOM element
        function createSeatElement(seat: Seat): HTMLElement {
          const seatEl = document.createElement("p");
          seatEl.textContent = seat.label;

          if (seat.is_booked) {
            seatEl.className =
              "flex justify-center items-center p-[5px] rounded-[6px] text-center bg-[#CBBAEA] text-white cursor-not-allowed w-[40px] h-[35px]";
          } else {
            seatEl.className =
              "flex justify-center items-center p-[5px] rounded-[6px] text-center text-xs border hover:bg-purple-500 cursor-pointer w-[40px] h-[35px]";

            seatEl.addEventListener("click", () => {
              seatEl.classList.toggle("selected");

              if (seatEl.classList.contains("selected")) {
                selectedSeats.add(seat.label);
              } else {
                selectedSeats.remove(seat.label);
              }

              const selectedArray = selectedSeats.toArray();
              if (selectedSeatsDisplay)
                selectedSeatsDisplay.textContent = selectedArray.join(", ");

              // Correct total price calculation
              let total = 0;
              selectedArray.forEach((selectedLabel) => {
                for (const rowSeats of Object.values(seatsByRow)) {
                  const matched = rowSeats.find(
                    (s) => s.label === selectedLabel
                  );
                  if (matched) {
                    total += parseFloat(matched.price.toString());
                    break;
                  }
                }
              });

              if (finalPriceDisplay) {
                finalPriceDisplay.textContent = `Rs.${total.toFixed(2)}`;
              }
            });
          }

          return seatEl;
        }

        leftSeats.forEach((seat) =>
          leftDiv.appendChild(createSeatElement(seat))
        );
        rightSeats.forEach((seat) =>
          rightDiv.appendChild(createSeatElement(seat))
        );

        const spacer = document.createElement("div");
        spacer.className = "w-[20px]";

        rowDiv.appendChild(leftDiv);
        rowDiv.appendChild(spacer);
        rowDiv.appendChild(rightDiv);

        seatContainer?.appendChild(rowDiv);
      });
    })
    .catch((err) => {
      console.error("Error loading seats:", err);
    });
}

//handle payment
payment_button?.addEventListener("click", async function () {
  if (!localStorage.getItem("auth-token")) {
    alert("Please Login First to continue ..")
    return;
  }

  if (selectedSeats.size === 0) {
    alert("No Seats Selected ..... Select The Seats First!!");
    return;
  }

  const selected_items = document.querySelectorAll(".selected");
  const formdata = new FormData();
  const place = selected_items[0].innerHTML;

  console.log(event_detail.event_venue);
  let venue_id;

  interface EventVenue {
    id: number;
    event_id: number;
    venue_id: number;
    location_id: number;
    start_datetime: string;
    created_at: string;
    updated_at: string;
    venue: {
      id: number;
      venue_name: string;
      max_seats: number;
      location_id: number;
      created_at: string;
      updated_at: string;
    };
  }

  (event_detail.event_venue as EventVenue[]).forEach((data: EventVenue) => {
    if (data.venue.venue_name === place) {
      venue_id = data.venue_id;
    }
  });

  formdata.append("venue_id", venue_id as any);

  if (selected_items[1].innerHTML === "Today") {
    const today = new Date();
    const formattedDate = today.toISOString().split("T")[0];
    formdata.append("date", formattedDate);
  } else if (selected_items[1].innerHTML === "Tomorrow") {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const yyyy = tomorrow.getFullYear();
    const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
    const dd = String(tomorrow.getDate()).padStart(2, "0");

    const formattedTomorrow = `${yyyy}-${mm}-${dd}`;
    formdata.append("date", formattedTomorrow);
  } else {
    formdata.append("date", selected_items[1].innerHTML);
  }

  formdata.append("time", selected_items[2].innerHTML);

  formdata.append("seats", JSON.stringify(selectedSeats.toArray()));

  var object = {} as any;
  formdata.forEach(function (value, key) {
    object[key] = value;
  });

  const final_price = document.getElementById("final_price");
  const new_price = final_price?.innerHTML.substring(3);
  object = { ...object, "price": new_price, "eventID": event_Id };

  localStorage.setItem("ticket_data", JSON.stringify(object));

  //stripe payment integration
  const response = await fetch(
    "http://127.0.0.1:8000/api/create-checkout-session",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: new_price,
        quantity: 1,
      }),
    }
  );

  const session = await response.json();
  const result = await stripe.redirectToCheckout({ sessionId: session.id });

  if (result.error) {
    alert(result.error.message);
  }
});
