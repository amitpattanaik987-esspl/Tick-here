
import { loadNavbar } from "../components/admin_navbar/navbar.js";

interface Event {
  id: number;
  title: string;
  description: string;
  duration: string;
  category: { name: string };
  admin_id: number;
  admin: { name: string };
  status: string;
  event_venue: Venue[];
}

interface Venue {
  id: number;
  location_name: string;
  state: string;
  country: string;
  venue_name: string;
  total_seats: number;
  start_datetime: string;
  tickets_booked: number;
}

interface Ticket {
  id: number;
  ticket_code: string;
  total_price: number;
  status: string;
  user_email: string;
  user_phone: string;
  seats_booked: number;
}

// Track active event and venue (for collapse logic)
let expandedEventId: number | null = null;
let expandedVenueId: number | null = null;

// Real stacks to keep history of interactions
const eventStack: number[] = [];
const venueStack: number[] = [];

let currentPageUrl = "http://127.0.0.1:8000/api/admin/events";

// Cache for events and sorting state
let sortBy: string | null = null;
let sortOrder: "asc" | "desc" = "asc";

// Determine status from venues' start_datetime
function calculateStatus(venues: Venue[]) {
  if (!venues || venues.length === 0) return "Cancelled";

  const now = new Date();
  const oneMonthLater = new Date();
  oneMonthLater.setMonth(oneMonthLater.getMonth() + 1);

  const upcomingDates = venues
    .map((v) => new Date(v.start_datetime))
    .sort((a, b) => a.getTime() - b.getTime());

  const earliest = upcomingDates[0];

  if (earliest < now) return "Completed";
  if (earliest <= oneMonthLater) return "Active";
  return "Inactive";
}

function renderEventRow(event: Event, index: number, status: string): string {
  const badgeClass: Record<string, string> = {
    Completed: "bg-gray-100 text-gray-600",
    Cancelled: "bg-red-100 text-red-700",
    Active: "bg-green-100 text-green-700",
    Inactive: "bg-yellow-100 text-yellow-700",
  };

  return `
    <div data-event-id="${
      event.id
    }" data-status="${status}" class="flex items-center w-[56.5rem] border-t border-gray-200 bg-white event-row hover:cursor-pointer">
      <div class="w-[6rem] p-3 justify-center">${event.id}</div>
      <div class="w-[10rem] p-3 justify-center">${event.title}</div>
      <div class="w-[19rem] p-3 justify-center">${event.description}</div>
      <div class="w-[8rem] p-3 justify-center">${event.duration}</div>
      <div class="w-[8rem] p-3 justify-center">${event.category.name}</div>
      <div class="w-[8rem] p-3 justify-center">${event.admin.name}</div>
      <div class="w-[8rem] p-3 justify-center text-center">
        <span class="px-3 py-1 rounded-full text-xs ${
          badgeClass[status]
        }">${status}</span></div>
      <div class="w-[16rem] p-3 flex gap-2 action-buttons justify-center">
        ${
          status === "Completed"
            ? `<span class="px-3 py-1 rounded-full text-xs bg-blue-100 text-blue-700">Details</span>`
            : status === "Cancelled"
            ? `<button data-created-by="${event.admin_id}" class= "deleteEventBtn border border-[#191970] text-xs text-[#404040] flex items-center px-3 py-1 rounded h-[1.625rem] delete-btn" > Delete </button>`
            : `<button data-created-by="${event.admin_id}" class="editEventBtn bg-gradient-to-r from-[#46006e] to-[#0a0417] text-white h-[1.625rem] w-16  px-3 py-1 flex justify-center items-center rounded edit-btn">Edit</button>
        <button data-created-by="${event.admin_id}" class="deleteEventBtn border border-[#191970] text-xs text-[#404040] flex items-center px-3 py-1 rounded h-[1.625rem] delete-btn">Delete</button>`
        }
      </div>
    </div>`;
}

let allEvents: Event[] = [];
//starts here 
function fetchEvents(url: string) {
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  const queryParams = new URLSearchParams();
  const searchValue = ($("#search-input").val() as string)?.trim();

  if (searchValue) {
    url = "http://127.0.0.1:8000/api/admin/events-search";
    queryParams.append("search", searchValue);
  } else {
    if (sortBy) {
      queryParams.append("sort_by", sortBy);
      queryParams.append("sort_order", sortOrder);
    }
  }

  const fullUrl = `${url}${url.includes("?") ? "&" : "?"}${queryParams.toString()}`;

  $.ajax({
    url: fullUrl,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    success: function (res) {
      if (res.success && res.payload && res.payload.data) {
        const events: Event[] = res.payload.data;

        //  allEvents (it should contain ALL records)
        // Just render the current page data
        const container = $("#event-table-body");
        container.empty();

        events.forEach((event, index) => {
          const status = calculateStatus(event.event_venue || []);
          container.append(renderEventRow(event, index + 1, status));
        });

        updatePagination(res.payload);
      } else {
        console.error("Unexpected structure:", res);
      }
    },
    error: function (xhr, status, err) {
      console.error("Error fetching events:", err);
    },
  });
}
// fetch code complete here 
function fetchAllEventsOnce() {
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  $.ajax({
    url: "http://127.0.0.1:8000/api/admin/events-all", 
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
   success: function (res) {
  if (res.success && Array.isArray(res.data)) {  
    allEvents = res.data;
    console.log("allEvents loaded:", allEvents.length);
  } else {
    console.error("Failed to load allEvents:", res);
  }
},

    error: function (xhr, status, err) {
      console.error("Error loading all events:", err);
    },
  });
}

//binary search function starting here 
function binarySearchEvents(rawInput: string) {
  const rawSearch = rawInput.trim();
  if (!rawSearch) return;

  const isNumeric = /^\d+$/.test(rawSearch);
  const searchSl = isNumeric ? Number(rawSearch) : NaN;
  const lowerSearch = rawSearch.toLowerCase();

  // Binary search allowed only when sorted by the right field
  if (sortBy !== "sl" && sortBy !== "title") {
    console.log("[Binary Disabled] Not sorted by sl or title. Using backend linear search.");
    fetchEvents("http://127.0.0.1:8000/api/admin/events");
    return;
  }

  // If sorted by sl but input is text, fallback to backend
  if (sortBy === "sl" && !isNumeric) {
    console.log("[Binary Disabled] Sorted by sl, but searching text. Using backend linear search.");
    fetchEvents("http://127.0.0.1:8000/api/admin/events");
    return;
  }

  // If sorted by title but input is numeric, fallback to backend
  if (sortBy === "title" && isNumeric) {
    console.log("[Binary Disabled] Sorted by title, but searching number. Using backend linear search.");
    fetchEvents("http://127.0.0.1:8000/api/admin/events");
    return;
  }

  // Prepare sorted array for binary search
  const asc = sortOrder === "asc";
  const sortedEvents = [...allEvents].sort((a, b) => {
    if (sortBy === "sl") {
      return asc ? a.id - b.id : b.id - a.id;
    }
    return asc
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title);
  });

  // ---- Binary search ----
  let low = 0;
  let high = sortedEvents.length - 1;
  let matchIndex = -1;

  while (low <= high) {
    const mid = (low + high) >> 1;
    if (sortBy === "sl") {
      const midSl = sortedEvents[mid].id;
      if (midSl === searchSl) { matchIndex = mid; break; }
      if (asc ? searchSl < midSl : searchSl > midSl) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    } else {
      const midVal = sortedEvents[mid].title.toLowerCase();
      if (midVal.startsWith(lowerSearch)) { matchIndex = mid; break; }
      if (asc ? lowerSearch < midVal : lowerSearch > midVal) {
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }
  }

  const results: Event[] = [];
  if (matchIndex !== -1) {
    if (sortBy === "sl") {
      results.push(sortedEvents[matchIndex]); // exact Sl match
    } else {
      // Collect neighbors with same prefix
      let i = matchIndex;
      while (i >= 0 && sortedEvents[i].title.toLowerCase().startsWith(lowerSearch)) {
        results.unshift(sortedEvents[i]);
        i--;
      }
      i = matchIndex + 1;
      while (i < sortedEvents.length && sortedEvents[i].title.toLowerCase().startsWith(lowerSearch)) {
        results.push(sortedEvents[i]);
        i++;
      }
    }
  }

  // If no binary match, fallback to includes within current sorted array
  if (results.length === 0) {
    if (sortBy === "sl") {
      results.push(...sortedEvents.filter(e => e.id.toString().includes(rawSearch)));
    } else {
      results.push(...sortedEvents.filter(e => e.title.toLowerCase().includes(lowerSearch)));
    }
  }

  // Render results
  const container = $("#event-table-body").empty();
  if (results.length) {
    results.forEach((event, index) => {
      const status = calculateStatus(event.event_venue || []);
      container.append(renderEventRow(event, index + 1, status));
    });
  } else {
    container.append(`<div class="p-4 text-center text-gray-500">No matching events found</div>`);
  }

  $("#pagination-controls").hide();
}
// binary search function ending here 

function updatePagination(payload: any) {
  currentPageUrl = payload.path + "?page=" + payload.current_page;

  $("#currentPage").text(
    `Page ${payload.current_page} of ${payload.last_page}`
  );

  // Enable/disable prev/next buttons and Save next/prev URLs
  // Prev button
  if (payload.prev_page_url) {
    $("#prevPage")
      .prop("disabled", false)
      .removeClass("opacity-50 cursor-not-allowed")
      .addClass("hover:cursor-pointer")
      .data("url", payload.prev_page_url);
  } else {
    $("#prevPage")
      .prop("disabled", true)
      .removeClass("hover:cursor-pointer")
      .addClass("opacity-50 cursor-not-allowed")
      .removeData("url");
  }

  // Next button
  if (payload.next_page_url) {
    $("#nextPage")
      .prop("disabled", false)
      .removeClass("opacity-50 cursor-not-allowed")
      .addClass("hover:cursor-pointer")
      .data("url", payload.next_page_url);
  } else {
    $("#nextPage")
      .prop("disabled", true)
      .removeClass("hover:cursor-pointer")
      .addClass("opacity-50 cursor-not-allowed")
      .removeData("url");
  }

  // Save first/last URLs
  $("#firstPage").data("url", payload.first_page_url);
  $("#lastPage").data("url", payload.last_page_url);
}
// Remove all venue and ticket rows
function removeVenueRows() {
  $(".venue-wrapper").remove();
  venueStack.length = 0; // clear venue history
  expandedVenueId = null;
}

function removeTicketRows() {
  $(".ticket-wrapper").remove();
  venueStack.length = 0;
  expandedVenueId = null;
}

// Render venue rows under selected event
function renderVenues(eventRow: HTMLElement, eventId: number) {
  // Remove existing (open) venue and ticket rows
  removeVenueRows();
  removeTicketRows();

  const token = localStorage.getItem("admin_token");
  if (!token) return;

  $.ajax({
    url: `http://127.0.0.1:8000/api/admin/events/${eventId}/venues`, // Adjust to your actual route
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    success: function (res) {
      if (res.success && res.data) {
        const venueWrapper = $(`
          <div class="w-[54.5rem] ml-4 mb-2 relative rounded-md bg-[#f9f9f9] border border-gray-300 flex flex-col items-start justify-start gap-2 text-left text-sm font-poppins venue-wrapper">
            <div class="w-full bg-[#f0f0f0] border-b border-gray-200 h-12 text-xs text-[#737373]">
              <div class="flex w-full items-center h-full">
                <div class="w-[15rem] p-3 font-bold">Venue</div>
                <div class="w-[15rem] p-3 font-bold">Location</div>
                <div class="w-[10rem] p-3 font-bold">State</div>
                <div class="w-[10rem] p-3 font-bold">Country</div>
                <div class="w-[10rem] p-3 font-bold">Start Time</div>
                <div class="w-[10rem] p-3 font-bold">Seats</div>
                <div class="w-[10rem] p-3 font-bold">Booked</div>
              </div>
            </div>
          </div>
        `);

        res.data.forEach((venue: Venue) => {
          const venueRow = $(`
            <div class="venue-row flex w-full items-center bg-white border-t border-gray-200 cursor-pointer" data-venue-id="${venue.id}">
              <div class="w-[15rem] p-3">${venue.venue_name}</div>
              <div class="w-[15rem] p-3">${venue.location_name}</div>
              <div class="w-[10rem] p-3">${venue.state}</div>
              <div class="w-[10rem] p-3">${venue.country}</div>
              <div class="w-[10rem] p-3">${venue.start_datetime}</div>
              <div class="w-[10rem] p-3">${venue.total_seats}</div>
              <div class="w-[10rem] p-3">${venue.tickets_booked}</div>
            </div>
          `);
          venueWrapper.append(venueRow);
        });

        $(venueWrapper).insertAfter($(eventRow));
        eventStack.push(eventId);
        expandedEventId = eventId;
      }
    },
    error: function (err) {
      console.error("Failed to fetch venues:", err);
    },
  });
}

// Render ticket rows under selected venue
function renderTickets(venueRow: HTMLElement, eventVenueId: number) {
  removeTicketRows(); // Remove existing (open) ticket rows

  const token = localStorage.getItem("admin_token");
  if (!token) return;

  $.ajax({
    url: `http://127.0.0.1:8000/api/admin/events/${eventVenueId}/tickets`, // Adjust this to your Laravel route
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    success: function (res) {
      if (res.success && res.data) {
        const ticketWrapper = $(`
          <div class=" w-[52.5rem] ml-4 mb-2 relative rounded-md bg-[#f1f1f1] border border-gray-300 flex flex-col items-start justify-start gap-2 text-left text-sm font-poppins ticket-wrapper">
            <div class="w-full bg-[#eeeeee] border-b border-gray-200 h-12 text-xs text-[#737373]">
              <div class="flex w-full items-center h-full">
                <div class="w-[8rem] p-3 font-bold">Ticket Code</div>
                <div class="w-[18rem] p-3 font-bold">Email</div>
                <div class="w-[10rem] p-3 font-bold">Phone</div>
                <div class="w-[8rem] p-3 font-bold">Seats</div>
                <div class="w-[8rem] p-3 font-bold">Price</div>
                <div class="w-[8rem] p-3 font-bold">Status</div>
              </div>
            </div>
          </div>
        `);

        res.data.forEach((ticket: Ticket) => {
          const ticketRow = $(`
            <div class="ticket-row flex w-full items-center bg-white border-t border-gray-200">
              <div class="w-[8rem] p-3">${ticket.ticket_code}</div>
              <div class="w-[18rem] p-3">${ticket.user_email}</div>
              <div class="w-[10rem] p-3">${ticket.user_phone}</div>
              <div class="w-[8rem] p-3">${ticket.seats_booked}</div>
              <div class="w-[8rem] p-3">₹${ticket.total_price}</div>
              <div class="w-[8rem] p-3">${ticket.status}</div>
            </div>
          `);
          ticketWrapper.append(ticketRow);
        });

        $(venueRow).after(ticketWrapper);
        venueStack.push(eventVenueId);
        expandedVenueId = eventVenueId;
      }
    },
    error: function (err) {
      console.error("Failed to fetch tickets:", err);
    },
  });
}

document.addEventListener("DOMContentLoaded", () => {
  loadNavbar();

  fetchEvents(currentPageUrl);
  fetchAllEventsOnce();

  // handle sorting for event's sl no, title, admin
  $(document).on("click", ".sortable-header", function () {
    const key = $(this).data("key");

    // Toggle order
    if (sortBy === key) {
      sortOrder = sortOrder === "asc" ? "desc" : "asc";
    } else {
      sortBy = key;
      sortOrder = "asc";
    }
  

    // Reset all icons to default parent color
    $(".sort-icon").removeClass("text-black");

    // Highlight current sort direction
    $(`#sort-${key}-${sortOrder}`).addClass("text-black");

    // If there's a search value, re-run; function will binary/linear correctly.
  const rawTerm = ($("#search-input").val() as string).trim();
  if (rawTerm) {
    binarySearchEvents(rawTerm);
    return;
  }
    // Refetch data with new sort order
    fetchEvents("http://127.0.0.1:8000/api/admin/events");
  });

  // handle pagination
  $(document).on(
    "click",
    "#firstPage, #prevPage, #nextPage, #lastPage",
    function () {
      const url = $(this).data("url");
      if (url) fetchEvents(url);
    }
  );

  // Handle event row clicks
  $(document).on("click", ".event-row", function () {
    const eventId = Number($(this).data("event-id"));
    const status = String($(this).data("status"));

    if (status === "Cancelled") {
      alert("This event has been cancelled.");
      return;
    }

    // Toggle venue display
    if (expandedEventId === eventId) {
      removeVenueRows();
      expandedEventId = null;
      removeTicketRows();
      expandedVenueId = null;
      return;
    }

    removeVenueRows();
    renderVenues(this, eventId);
  });

  // Handle venue row clicks
  $(document).on("click", ".venue-row", function (e) {
    e.stopPropagation();

    const venueId = Number($(this).data("venue-id"));
    const parentEventRow = $(this).closest(".venue-wrapper").prev(".event-row");
    const eventStatus = String(parentEventRow.data("status"));

    if (eventStatus === "Cancelled") {
      alert("This event has been cancelled.");
      return;
    }

    if (eventStatus === "Inactive") {
      alert("Booking for this event has not started yet.");
      return;
    }

    if (expandedVenueId === venueId) {
      removeTicketRows();
      expandedVenueId = null;
      return;
    }

    removeTicketRows();
    renderTickets(this, venueId);
  });

// handle search input 

  $("#search-input").on("keydown", (event) => {
  if (event.key !== "Enter") return;
  const rawTerm = ($("#search-input").val() as string).trim();
  if (!rawTerm) return;
  binarySearchEvents(rawTerm); // central logic decides binary or backend linear
});




  // create-event.ts
  const addEventBtn = document.getElementById("addEventBtn");

  addEventBtn?.addEventListener("click", () => {
    // navigate to event form page
    window.location.href = "/admin/create_event/";
  });

  $(document).on("click", ".editEventBtn", function (e) {
    e.stopPropagation();

    const eventCreatedBy = $(this).data("created-by");

    const loggedInAdmin = localStorage.getItem("admin_info");
    console.log(loggedInAdmin, eventCreatedBy);

    if (eventCreatedBy.toString() !== loggedInAdmin) {
      alert("You are not authorized to edit this event.");
      return;
    }

    const eventRow = $(this).closest(".event-row");
    const eventId = Number(eventRow.data("event-id"));
    const eventStatus = String(eventRow.data("status"));

    $.ajax({
      url: `http://127.0.0.1:8000/api/events/${eventId}`,
      method: "GET",
      success: function (res) {
        if (res.success && res.data) {
          console.log(res.data);

          const eventData = res.data;

          // If event is Active and has tickets booked, restrict full editing
          const hasTickets = eventData.event_venue?.some(
            (venue: any) => venue.tickets_booked > 0
          );

          if (eventStatus === "Active" && hasTickets) {
            // Limit editing fields — allow only basic info
            eventData.__edit_mode = "partial";
          } else {
            eventData.__edit_mode = "full";
          }

          console.log(eventData);

          localStorage.setItem("edit_event_data", JSON.stringify(eventData));
          window.location.href = "/admin/create_event/";
        }
      },
      error: function (err) {
        console.error("Failed to fetch event:", err);
        alert("Failed to load event for editing.");
      },
    });
  });

  $(document).on("click", ".deleteEventBtn", function (e) {
    e.stopPropagation();

    const token = localStorage.getItem("admin_token");
    if (!token) {
      alert("You are not authenticated.");
      return;
    }

    const eventCreatedBy = $(this).data("created-by");

    const loggedInAdmin = localStorage.getItem("admin_info");

    if (eventCreatedBy.toString() !== loggedInAdmin) {
      alert("You are not authorized to delete this event.");
      return;
    }

    const eventRow = $(this).closest(".event-row");
    const eventId = Number(eventRow.data("event-id"));
    const status = String(eventRow.data("status"));

    if (status === "Completed") {
      alert("Completed events cannot be deleted.");
      return;
    }

    if (status !== "Cancelled") {
      // open choice modal
      $("#eventActionModal").removeClass("hidden");

      $(".closeActionModal").on("click", function () {
        $("#eventActionModal").addClass("hidden");
      });

      $("#cancelChoiceBtn").on("click", function () {
        // CANCEL OPTION: unlink venues
        $.ajax({
          url: `http://127.0.0.1:8000/api/admin/events/${eventId}/cancel`,
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          success: function (res) {
            alert("Event has been cancelled.");
            fetchEvents(currentPageUrl);
            $("#eventActionModal").addClass("hidden");
          },
          error: function (err) {
            console.error("Cancellation error:", err);
            alert("Failed to cancel event.");
          },
        });
      });

      $("#deleteChoiceBtn").on("click", function () {
        // DELETE OPTION
        $.ajax({
          url: `http://127.0.0.1:8000/api/admin/events/${eventId}`,
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          success: function (res) {
            alert("Event deleted successfully.");
            fetchEvents(currentPageUrl);
            $("#eventActionModal").addClass("hidden");
          },
          error: function (xhr) {
            alert("Failed to delete event.");
            console.error(xhr.responseText);
          },
        });
      });
    } else {
      const confirmed = confirm("Are you sure you want to delete this event?");
      if (!confirmed) return;
      // DELETE OPTION
      $.ajax({
        url: `http://127.0.0.1:8000/api/admin/events/${eventId}`,
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        success: function (res) {
          alert("Event deleted successfully.");
          fetchEvents(currentPageUrl);
        },
        error: function (xhr) {
          alert("Failed to delete event.");
          console.error(xhr.responseText);
        },
      });
    }
  });
});
