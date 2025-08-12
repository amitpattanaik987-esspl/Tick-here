import { loadNavbar } from "../components/admin_navbar/navbar.js";
import {
  hideLoader,
  initLoader,
  showLoader,
} from "../../components/loader/loader.js";

interface Location {
  id: number;
  country: string;
  state: string;
  city: string;
}

let currentPageUrl = "http://127.0.0.1:8000/api/admin/locations";

function fetchLocations(url: string) {
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
      const locations: Location[] = res.data.data;
      const tbody = $("#location-table-body");
      tbody.empty();

      locations.forEach((location: Location) => {
        tbody.append(`
        <div data-location-id="${location.id}" class="flex items-center w-[56.5rem] border-t border-gray-200 bg-white location-row">
          <div data-id="${location.id}" class="w-[7rem] p-3 justify-center">${location.id}</div>
          <div class="city w-[15rem] p-3 justify-center">${location.city}</div>
          <div class="state w-[18rem] p-3 justify-center">${location.state}</div>
          <div class="country w-[11rem] p-3 justify-center">${location.country}</div>
          <div class="w-[12rem] p-3 flex gap-2 action-buttons justify-center">
            <button class="editLocationBtn bg-gradient-to-r from-[#46006e] to-[#0a0417] text-white h-[1.625rem] w-16  px-3 py-1 flex justify-center items-center rounded edit-btn hover:cursor-pointer">Edit</button>
            <button class="deleteLocationBtn border border-[#191970] text-xs text-[#404040] flex items-center px-3 py-1 rounded h-[1.625rem] delete-btn hover:cursor-pointer">Delete</button>
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
          : "Failed to fetch locations."
      );

      hideLoader();
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

document.addEventListener("DOMContentLoaded", async () => {
  await initLoader();

  loadNavbar();

  fetchLocations(currentPageUrl);

  let editMode = false;
  let editingLocationId: number | null = null;

  // Load form HTML once
  let formLoaded = false;

  function loadLocationForm(callback?: () => void) {
    if (!formLoaded) {
      $("#create-location-wrapper").load(
        "/admin/components/create_location/index.html",
        function () {
          formLoaded = true;
          bindFormEvents(); // bind after load
          if (callback) callback();
        }
      );
    } else {
      if (callback) callback();
    }
  }

  function bindFormEvents() {
    $("#cancelLocationCreate").on("click", function () {
      $("#location-form-container").addClass("hidden");
      $("#addLocationBtn")
        .prop("disabled", false)
        .removeClass("opacity-50 cursor-not-allowed")
        .addClass(
          "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
        );
      resetForm();
    });

    $("#createLocationBtn").on("click", function () {
      showLoader();
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const country = ($("#country").val() as string)?.trim();
      const state = ($("#state").val() as string)?.trim();
      const city = ($("#city").val() as string)?.trim();

      // Regex patterns
      const countryRegex = /^[A-Za-z\s\-]+$/;
      const stateCityRegex = /^[A-Za-z0-9\s\-]+$/;

      let hasError = false;

      // Reset all previous errors
      $("#countryError, #stateError, #cityError").text("").addClass("hidden");
      $("#country, #state, #city").removeClass("border-red-500");

      // Validate Country
      if (!country) {
        $("#countryError").text("Country is required.").removeClass("hidden");
        $("#country").addClass("border-red-500");
        hasError = true;
      } else if (!countryRegex.test(country)) {
        $("#countryError")
          .text("Country must contain only letters, spaces, or hyphens.")
          .removeClass("hidden");
        $("#country").addClass("border-red-500");
        hasError = true;
      }

      // Validate State
      if (!state) {
        $("#stateError").text("State is required.").removeClass("hidden");
        $("#state").addClass("border-red-500");
        hasError = true;
      } else if (!stateCityRegex.test(state)) {
        $("#stateError")
          .text("State must not contain special characters.")
          .removeClass("hidden");
        $("#state").addClass("border-red-500");
        hasError = true;
      }

      // Validate City
      if (!city) {
        $("#cityError").text("City is required.").removeClass("hidden");
        $("#city").addClass("border-red-500");
        hasError = true;
      } else if (!stateCityRegex.test(city)) {
        $("#cityError")
          .text("City must not contain special characters.")
          .removeClass("hidden");
        $("#city").addClass("border-red-500");
        hasError = true;
      }

      // Stop if any error exists
      if (hasError) {
        hideLoader();
        return;
      }

      const locationData = { country, state, city };

      if (editMode && editingLocationId !== null) {
        console.log("Saving changes for ID:", editingLocationId, locationData);

        // Send PUT/PATCH to update
        $.ajax({
          url: `http://127.0.0.1:8000/api/admin/locations/${editingLocationId}`,
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          data: locationData,
          success: function (res) {
            alert("location updated successfully!");
            resetForm();
            $("#location-form-container").addClass("hidden");
            $("#addLocationBtn")
              .prop("disabled", false)
              .removeClass("opacity-50 cursor-not-allowed")
              .addClass(
                "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
              );
            hideLoader();
            fetchLocations(currentPageUrl);
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
        console.log("Creating new location:", locationData);

        // Send POST to create
        $.ajax({
          url: "http://127.0.0.1:8000/api/admin/locations",
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
          data: locationData,
          success: function (res) {
            alert("location created successfully!");
            resetForm();
            $("#location-form-container").addClass("hidden");
            $("#addLocationBtn")
              .prop("disabled", false)
              .removeClass("opacity-50 cursor-not-allowed")
              .addClass(
                "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
              );
            hideLoader();
            fetchLocations(currentPageUrl);
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
    editingLocationId = null;
    $("#createLocationBtn").text("Create");
    $("#country").val("");
    $("#state").val("");
    $("#city").val("");
    $("#countryError, #stateError, #cityError").text("").addClass("hidden");
    $("#country, #state, #city").removeClass("border-red-500");
  }

  // Add New location button clicked
  $("#addLocationBtn").on("click", function () {
    $(this)
      .prop("disabled", true)
      .addClass("opacity-50 cursor-not-allowed")
      .removeClass(
        "hover:from-[#46006e] hover:to-[#0a0417] hover:text-white hover:cursor-pointer"
      );

    loadLocationForm(() => {
      resetForm();
      $("#createLocationBtn").text("Create");
      $("#location-form-container").removeClass("hidden");
    });
  });

  $("#search-input").on("keydown", (event) => {
    if (event.key === "Enter") {
      fetchLocations("http://127.0.0.1:8000/api/admin/locations");
    }
  });

  // Handle Edit button click (example event delegation)
  $("#location-table-body").on("click", ".editLocationBtn", function () {
    const row = $(this).closest(".location-row");
    editingLocationId = row.data("location-id");

    const country = row.find(".country").text().trim();
    const state = row.find(".state").text().trim();
    const city = row.find(".city").text().trim();

    loadLocationForm(() => {
      editMode = true;
      $("#country").val(country);
      $("#state").val(state);
      $("#city").val(city);

      $("#createLocationBtn").text("Save");
      $("#location-form-container").removeClass("hidden");
    });
  });

  // Handle Delete button click
  $("#location-table-body").on("click", ".deleteLocationBtn", function () {
    showLoader();
    const token = localStorage.getItem("admin_token");
    if (!token) return;

    const row = $(this).closest(".location-row");
    const locationId = row.data("location-id");

    if (confirm("Are you sure you want to delete this location?")) {
      $.ajax({
        url: `http://127.0.0.1:8000/api/admin/locations/${locationId}`,
        type: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        success: function (response, status, xhr) {
          if (xhr.status === 204) {
            alert("location deleted.");
            fetchLocations(currentPageUrl); // Reload updated location list
          } else {
            alert("Unexpected response.");
          }
          hideLoader();
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
      if (url) fetchLocations(url);
    }
  );

  // Initial load
  fetchLocations(currentPageUrl);
});
