import { loadNavbar } from "../../components/navbar/navbar.js";
import { loadFooter } from "../../components/footer/footer.js";
import { loadContactModal } from "../../components/contact-modal/contactModal.js";
import { loadLocationModal } from "../../components/location-modal/locationModal.js";
import {
  initLoader,
  showLoader,
  hideLoader,
} from "../../components/loader/loader.js";

initLoader();

document.addEventListener("DOMContentLoaded", () => {
  showLoader();
  loadNavbar();
  loadFooter();
  loadContactModal();
  loadLocationModal();
  hideLoader();
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

  showLoader();
  fetch(apiUrl)
    .then((res) => {
      if (!res.ok) {
        alert("Failed to fetch event details");
        window.location.href = "/";
      }
      return res.json();
    })
    .then((data) => {
      hideLoader();
      if (!data.success) throw new Error("Event fetch unsuccessful");

      console.log(data);

      const event = data.data;
      event_detail = event;

      const userLocation = JSON.parse(
        sessionStorage.getItem("selectedLocation") || "{}"
      );
      if (!userLocation || !userLocation.city) {
        alert("Please select a location before proceeding.");
        hideLoader();
        return;
      }

      const filteredVenues = event.event_venue.filter(
        (v: any) => v.venue.location.city === userLocation.city
      );

      if (filteredVenues.length === 0) {
        alert("No shows available in your selected city.");
        hideLoader();
        return;
      }

      // DOM population
      document.getElementById("event-title")!.textContent = event.title;
      document.getElementById("event-duration")!.textContent = formatDuration(
        event.duration
      );
      document.getElementById("event-description")!.textContent =
        event.description;
      document.getElementById(
        "event_category"
      )!.textContent = `${event.category.name} Show`;
      const firstVenuePrice = filteredVenues[0].venue.seat_price;
      document.getElementById(
        "event-price"
      )!.textContent = `${firstVenuePrice}`;

      const venue_div = document.getElementById("Venues_div");
      const date_div = document.getElementById("date_div");
      const show_time_div = document.getElementById("show_time_div");

      const venueMap = new Map<number, any[]>();

      filteredVenues.forEach((ev: any) => {
        if (!venueMap.has(ev.venue_id)) {
          venueMap.set(ev.venue_id, []);
        }
        venueMap.get(ev.venue_id)!.push(ev);
      });

      venueMap.forEach((venueGroup, venueId) => {
        const venueData = venueGroup[0];
        const venue = document.createElement("p");
        venue.className =
          "bg-[#EAE2FF] rounded-[10px] px-[30px] py-[10px] w-[377px] text-center border-[1px] cursor-pointer";
        venue.textContent = venueData.venue.venue_name;

        venue.addEventListener("click", function () {
          document.querySelectorAll("#Venues_div .selected").forEach((el) =>
            el.classList.remove("selected")
          );
          venue.classList.add("selected");

          document.getElementById("event-price")!.textContent =
            venueData.venue.seat_price;

          date_div!.innerHTML = "";
          show_time_div!.innerHTML = "";

          const groupedByDate: { [date: string]: any[] } = {};
          venueGroup.forEach((item) => {
            const dateStr = extractDateLabel(item.start_datetime);
            if (!groupedByDate[dateStr]) groupedByDate[dateStr] = [];
            groupedByDate[dateStr].push(item);
          });

          // Render dates
          Object.entries(groupedByDate).forEach(([dateLabel, times]) => {
            const dateEl = document.createElement("p");
            dateEl.className =
              "bg-[#EAE2FF] rounded-[10px] px-[34px] py-[10px] w-[200px] text-center border-[1px] cursor-pointer";
            dateEl.textContent = dateLabel;

            dateEl.addEventListener("click", function () {
              document
                .querySelectorAll("#date_div .selected")
                .forEach((el) => el.classList.remove("selected"));
              dateEl.classList.add("selected");

              // Clear and render show times for selected date
              show_time_div!.innerHTML = "";
              times.forEach((timeItem) => {
                const timeEl = document.createElement("p");
                timeEl.className =
                  "bg-[#EAE2FF] rounded-[10px] px-[34px] py-[10px] w-[320px] text-center border-[1px] cursor-pointer";
                timeEl.textContent = extractTime(timeItem.start_datetime);

                timeEl.addEventListener("click", () => {
                  document
                    .querySelectorAll("#show_time_div .selected")
                    .forEach((el) => el.classList.remove("selected"));
                  timeEl.classList.add("selected");
                });

                show_time_div?.appendChild(timeEl);
              });

              // Auto-select the first show time
              (show_time_div?.firstElementChild as HTMLElement)?.classList.add("selected");
            });

            date_div?.appendChild(dateEl);
          });

          // Auto-select the first date
          const firstDate = date_div?.firstElementChild as HTMLElement;
          firstDate?.click(); // triggers the date click to populate showtimes

          fetchAndRenderSeats(venueData.venue.id);
        });

        venue_div?.appendChild(venue);
      });


      // Select the first venue automatically
      (venue_div?.firstElementChild as HTMLElement)?.click();


      (venue_div?.firstElementChild as HTMLElement)?.classList.add("selected");
      (date_div?.firstElementChild as HTMLElement)?.classList.add("selected");
      (show_time_div?.firstElementChild as HTMLElement)?.classList.add(
        "selected"
      );

      fetchAndRenderSeats(filteredVenues[0].venue.id);

      const thumbnail = document.getElementById(
        "event-thumbnail"
      ) as HTMLImageElement;
      thumbnail.src = event.thumbnail.startsWith("http")
        ? event.thumbnail
        : `http://127.0.0.1:8000/storage/${event.thumbnail}`;
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
  const date = new Date(datetimeStr.replace(" ", "T"));
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
  today.setHours(0, 0, 0, 0);
  tomorrow.setHours(0, 0, 0, 0);
  inputDate.setHours(0, 0, 0, 0);

  if (inputDate.getTime() === today.getTime()) return "Today";
  else if (inputDate.getTime() === tomorrow.getTime()) return "Tomorrow";
  else
    return inputDate.toLocaleDateString("en-US", {
      weekday: "short",
      day: "2-digit",
      month: "short",
    });
}

function fetchAndRenderSeats(venueId: number) {
  showLoader();
  fetch(`http://127.0.0.1:8000/api/venues/${venueId}/seats`)
    .then((res) => res.json())
    .then((data) => {
      if (!data.success) throw new Error("Seat fetch failed");
      hideLoader();

      const seatContainer = document.querySelector(".seat-grid")!;
      seatContainer.innerHTML = "";

      const selectedSeatsDisplay = document.getElementById("selected_seats");
      const finalPriceDisplay = document.getElementById("final_price");

      const seatsByRow: { [row: string]: Seat[] } = {};
      data.seats.forEach((seat: Seat) => {
        const row = seat.label.match(/^[A-Z]+/g)?.[0] || "";
        if (!seatsByRow[row]) seatsByRow[row] = [];
        seatsByRow[row].push(seat);
      });

      const sortedRows = Object.keys(seatsByRow).sort((a, b) =>
        a.length !== b.length ? a.length - b.length : a.localeCompare(b)
      );

      sortedRows.forEach((row) => {
        const rowDiv = document.createElement("div");
        rowDiv.className =
          "flex gap-[10px] justify-center items-center mb-[10px]";

        const rowLabel = document.createElement("span");
        rowLabel.className = "w-[40px] text-right mr-[10px] font-semibold";
        rowLabel.textContent = row;
        rowDiv.appendChild(rowLabel);

        const leftDiv = document.createElement("div");
        leftDiv.className = "flex gap-[5px]";
        const rightDiv = document.createElement("div");
        rightDiv.className = "flex gap-[5px]";
        const halfIndex = Math.ceil(seatsByRow[row].length / 2);
        const leftSeats = seatsByRow[row].slice(0, halfIndex);
        const rightSeats = seatsByRow[row].slice(halfIndex);

        function createSeat(seat: Seat): HTMLElement {
          const el = document.createElement("p");
          el.textContent = seat.label;

          if (seat.is_booked) {
            el.className =
              "flex justify-center items-center p-[5px] rounded-[6px] bg-[#CBBAEA] text-white cursor-not-allowed w-[40px] h-[35px]";
          } else {
            el.className =
              "flex justify-center items-center p-[5px] rounded-[6px] text-xs border hover:bg-purple-500 cursor-pointer w-[40px] h-[35px]";
            el.addEventListener("click", () => {
              el.classList.toggle("selected");
              if (el.classList.contains("selected"))
                selectedSeats.add(seat.label);
              else selectedSeats.remove(seat.label);

              const selected = selectedSeats.toArray();
              selectedSeatsDisplay!.textContent = selected.join(", ");
              let total = 0;
              selected.forEach((label) => {
                for (const row of Object.values(seatsByRow)) {
                  const match = row.find((s) => s.label === label);
                  if (match) {
                    total += parseFloat(match.price);
                    break;
                  }
                }
              });
              finalPriceDisplay!.textContent = `Rs.${total.toFixed(2)}`;
            });
          }
          return el;
        }

        leftSeats.forEach((seat) => leftDiv.appendChild(createSeat(seat)));
        rightSeats.forEach((seat) => rightDiv.appendChild(createSeat(seat)));

        rowDiv.appendChild(leftDiv);
        rowDiv.appendChild(document.createElement("div")).className =
          "w-[20px]";
        rowDiv.appendChild(rightDiv);
        seatContainer.appendChild(rowDiv);
      });
    })
    .catch((err) => console.error("Error loading seats:", err));
}

payment_button?.addEventListener("click", async () => {
  showLoader();
  if (!localStorage.getItem("auth-token")) {
    alert("Please Login First to continue ..");
    hideLoader();
    return;
  }

  if (selectedSeats.size === 0) {
    alert("No Seats Selected ..... Select The Seats First!!");
    hideLoader();
    return;
  }

  const selected_items = document.querySelectorAll(".selected");
  const formdata = new FormData();
  const place = selected_items[0].innerHTML;

  localStorage.setItem("selectedVenue", place);

  let venue_id;
  (event_detail.event_venue || []).forEach((data: any) => {
    if (data.venue.venue_name === place) {
      venue_id = data.venue_id;
    }
  });

  formdata.append("venue_id", venue_id as any);

  const date_label = selected_items[1].innerHTML;
  if (date_label === "Today") {
    formdata.append("date", new Date().toISOString().split("T")[0]);
  } else if (date_label === "Tomorrow") {
    const t = new Date();
    t.setDate(t.getDate() + 1);
    formdata.append("date", t.toISOString().split("T")[0]);
  } else {
    formdata.append("date", date_label);
  }

  formdata.append("time", selected_items[2].innerHTML);
  formdata.append("seats", JSON.stringify(selectedSeats.toArray()));

  let object: any = {};
  formdata.forEach((value, key) => {
    object[key] = value;
  });

  const new_price = document
    .getElementById("final_price")
    ?.innerHTML.substring(3);
  object = { ...object, price: new_price, eventID: event_Id };
  localStorage.setItem("ticket_data", JSON.stringify(object));

  const response = await fetch(
    "http://127.0.0.1:8000/api/create-checkout-session",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
      },
      body: JSON.stringify({ amount: new_price, quantity: 1 }),
    }
  );
  hideLoader();

  const session = await response.json();
  const result = await stripe.redirectToCheckout({ sessionId: session.id });
  if (result.error) alert(result.error.message);
});
