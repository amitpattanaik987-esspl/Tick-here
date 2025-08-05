import { loadNavbar } from "../components/admin_navbar/navbar.js";
import {
  hideLoader,
  initLoader,
  showLoader,
} from "../../components/loader/loader.js";

interface Venue {
  id: number;
  venue_name: string;
  location_id: number;
  max_seats: number;
  seat_price: number;
  location: {
    city: string;
  };
}

let currentPageUrl = "http://127.0.0.1:8000/api/admin/venues";

function fetchVenues(url: string) {
  showLoader();
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  const queryParams = new URLSearchParams();

  const searchValue = ($("#search-input").val() as string)?.trim();

  // Add search param if present
  if (searchValue) {
    queryParams.append("search", searchValue);
  }

  const fullUrl = `${url}${
    url.includes("?") ? "&" : "?"
  }${queryParams.toString()}`;

  $.ajax({
    url: fullUrl,
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    success: function (res) {
      const venues: Venue[] = res.data.data;
      const tbody = $("#venue-table-body");
      tbody.empty();

      venues.forEach((venue: Venue) => {
        tbody.append(`
        <div data-venue-id="${venue.id}" class="flex items-center w-[56.5rem] border-t border-gray-200 bg-white venue-row">
          <div data-id="${venue.id}" class="w-[7rem] p-3 justify-center">${venue.id}</div>
          <div class="venue-name w-[15rem] p-3 justify-center">${venue.venue_name}</div>
          <div class="venue-location w-[18rem] p-3 justify-center" data-location-id="${venue.location_id}">${venue.location.city}</div>
          <div class="venue-seats w-[10rem] p-3 justify-center">${venue.max_seats}</div>
          <div class="venue-cost w-[10rem] p-3 justify-center">${venue.seat_price}</div>
          <div class="w-[12rem] p-3 flex gap-2 action-buttons justify-center">
            <button class="editVenueBtn bg-gradient-to-r from-[#46006e] to-[#0a0417] text-white h-[1.625rem] w-16  px-3 py-1 flex justify-center items-center rounded edit-btn hover:cursor-pointer">Edit</button>
            <button class="deleteVenueBtn border border-[#191970] text-xs text-[#404040] flex items-center px-3 py-1 rounded h-[1.625rem] delete- hover:cursor-pointer">Delete</button>
          </div>
        </div>`);
      });

      updatePagination(res.data);
      hideLoader();
    },
    error: function (xhr) {
      const errors = xhr.responseJSON?.errors;
      alert(
        errors
          ? Object.values(errors).flat().join("\n")
          : "Failed to fetch venues."
      );
      hideLoader();
    },
  });
}

function loadLocationOptions(callback?: () => void) {
  $.ajax({
    url: "http://127.0.0.1:8000/api/locations",
    method: "GET",
    success: function (res) {
      const locations = res.data;
      const select = $("#venue-location");
      select.empty();
      select.append(`<option value="">Select Location</option>`);

      locations.forEach((loc: { id: number; city: string }) => {
        select.append(`<option value="${loc.id}">${loc.city}</option>`);
      });

      if (typeof callback === "function") callback(); // execute after options are loaded
    },
    error: function (xhr) {
      console.error("Failed to load locations:", xhr.responseJSON || xhr);
      alert("Could not load locations");
    },
  });
}

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

document.addEventListener("DOMContentLoaded", () => {
  initLoader();
  loadNavbar();

  fetchVenues(currentPageUrl);

  let editMode = false;
  let editingVenueId: number | null = null;

  // Load form HTML once
  let formLoaded = false;

  function loadVenueForm(callback?: () => void) {
    if (!formLoaded) {
      $("#create-venue-wrapper").load(
        "/admin/components/create_venue/index.html",
        function () {
          formLoaded = true;
          bindFormEvents(); // bind after load
          if (callback) callback();

          loadLocationOptions();
        }
      );
    } else {
      if (callback) callback();
    }
  }

  function bindFormEvents() {
    $("#cancelVenueCreate").on("click", function () {
      $("#venue-form-container").addClass("hidden");
      $("#addVenueBtn")
        .prop("disabled", false)
        .removeClass("opacity-50 cursor-not-allowed")
        .addClass(
          "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
        );
      resetForm();
    });

    $("#createVenueBtn").on("click", function () {
      showLoader();
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const venueData = {
        venue_name: $("#venue-name").val(),
        location_id: $("#venue-location").val(),
        price: $("#venue-cost").val(),
        max_seats: $("#venue-seats").val(),
      };

      if (editMode && editingVenueId !== null) {
        console.log("Saving changes for ID:", editingVenueId, venueData);

        // Send PUT/PATCH to update
        $.ajax({
          url: `http://127.0.0.1:8000/api/admin/venues/${editingVenueId}`,
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          data: venueData,
          success: function (res) {
            alert("Venue updated successfully!");
            resetForm();
            $("#venue-form-container").addClass("hidden");
            $("#addVenueBtn")
              .prop("disabled", false)
              .removeClass("opacity-50 cursor-not-allowed")
              .addClass(
                "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
              );
            hideLoader();
            fetchVenues(currentPageUrl);
          },
          error: function (xhr) {
            const errors = xhr.responseJSON?.errors;
            alert(
              errors
                ? Object.values(errors).flat().join("\n")
                : "Update failed."
            );
            hideLoader();
          },
        });
      } else {
        console.log("Creating new venue:", venueData);

        // Send POST to create
        $.ajax({
          url: "http://127.0.0.1:8000/api/admin/venues",
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          data: venueData,
          success: function (res) {
            alert("Venue created successfully!");
            $("#addVenueBtn")
              .prop("disabled", false)
              .removeClass("opacity-50 cursor-not-allowed")
              .addClass(
                "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
              );
            hideLoader();
            resetForm();
            $("#venue-form-container").addClass("hidden");
            fetchVenues(currentPageUrl);
          },
          error: function (xhr) {
            const errors = xhr.responseJSON?.errors;
            alert(
              errors
                ? Object.values(errors).flat().join("\n")
                : "Creation failed."
            );
            hideLoader();
          },
        });
      }
    });
  }

  function resetForm() {
    editMode = false;
    editingVenueId = null;
    $("#createVenueBtn").text("Create");
    $("#venue-name").val("");
    $("#venue-location").val("").data("location-id", "");
    $("#venue-cost").val("");
    $("#venue-seats").val("");
  }

  // Add New Venue button clicked
  $("#addVenueBtn").on("click", function () {
    $(this)
      .prop("disabled", true)
      .addClass("opacity-50 cursor-not-allowed")
      .removeClass(
        "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
      );
    loadVenueForm(() => {
      resetForm();
      $("#createVenueBtn").text("Create");
      $("#venue-form-container").removeClass("hidden");
    });
  });

  $("#search-input").on("keydown", (event) => {
    if (event.key === "Enter") {
      fetchVenues("http://127.0.0.1:8000/api/admin/venues");
    }
  });

  // Handle Edit button click (example event delegation)
  $("#venue-table-body").on("click", ".editVenueBtn", function () {
    const row = $(this).closest(".venue-row");
    editingVenueId = row.data("venue-id");

    const name = row.find(".venue-name").text().trim();
    const locationId = row.find(".venue-location").data("location-id");
    const cost = row.find(".venue-cost").text().trim();
    const seats = row.find(".venue-seats").text().trim();

    loadVenueForm(() => {
      editMode = true;

      $("#venue-name").val(name);
      $("#venue-cost").val(cost);
      $("#venue-seats").val(seats);

      // Load location options first, then set the selected value
      loadLocationOptions(() => {
        $("#venue-location").val(locationId).trigger("change");
      });

      $("#createVenueBtn").text("Save");
      $("#venue-form-container").removeClass("hidden");
    });
  });

  // Handle Delete button click
  $("#venue-table-body").on("click", ".deleteVenueBtn", function () {
    showLoader();
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const row = $(this).closest(".venue-row");
    const venueId = row.data("venue-id");

    if (confirm("Are you sure you want to delete this venue?")) {
      $.ajax({
        url: `http://127.0.0.1:8000/api/admin/venues/${venueId}`,
        type: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        success: function (response, status, xhr) {
          if (xhr.status === 204) {
            alert("Venue deleted.");
            fetchVenues(currentPageUrl); // Reload updated venue list
            hideLoader();
          } else {
            alert("Unexpected response.");
            hideLoader();
          }
        },
        error: function (xhr) {
          alert("Delete failed.");
          console.error(xhr.responseJSON || xhr.responseText);
          hideLoader();
        },
      });
    }
  });

  // handle pagination
  $(document).on(
    "click",
    "#firstPage, #prevPage, #nextPage, #lastPage",
    function () {
      const url = $(this).data("url");
      if (url) fetchVenues(url);
    }
  );

  // Initial load
  fetchVenues(currentPageUrl);
});
