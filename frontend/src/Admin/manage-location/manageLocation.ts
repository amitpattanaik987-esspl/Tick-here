import { loadNavbar } from "../components/admin_navbar/navbar.js";

interface Location {
  id: number;
  country: string;
  state: string;
  city: string;
}

let currentPageUrl = "http://127.0.0.1:8000/api/admin/locations";

function fetchLocations(url: string) {
  const token = localStorage.getItem("admin_token");
  if (!token) return;

  $.ajax({
    url: url,
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
          <div class="country w-[15rem] p-3 justify-center">${location.country}</div>
          <div class="state w-[18rem] p-3 justify-center">${location.state}</div>
          <div class="city w-[10rem] p-3 justify-center">${location.city}</div>
          <div class="w-[12rem] p-3 flex gap-2 action-buttons justify-center">
            <button class="editLocationBtn bg-gradient-to-r from-[#46006e] to-[#0a0417] text-white h-[1.625rem] w-16  px-3 py-1 flex justify-center items-center rounded edit-btn">Edit</button>
            <button class="deleteLocationBtn border border-[#191970] text-xs text-[#404040] flex items-center px-3 py-1 rounded h-[1.625rem] delete-btn">Delete</button>
          </div>
        </div>`);
      });

      updatePagination(res.data);
    },
    error: function (xhr) {
      const errors = xhr.responseJSON?.errors;
      alert(
        errors
          ? Object.values(errors).flat().join("\n")
          : "Failed to fetch locations."
      );
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
      resetForm();
    });

    $("#createLocationBtn").on("click", function () {
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const locationData = {
        country: $("#country").val(),
        state: $("#state").val(),
        city: $("#city").val(),
      };

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
            fetchLocations(currentPageUrl);
          },
          error: function (xhr) {
            const errors = xhr.responseJSON?.errors;
            alert(
              errors
                ? Object.values(errors).flat().join("\n")
                : "Update failed."
            );
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
            fetchLocations(currentPageUrl);
          },
          error: function (xhr) {
            const errors = xhr.responseJSON?.errors;
            alert(
              errors
                ? Object.values(errors).flat().join("\n")
                : "Creation failed."
            );
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
  }

  // Add New location button clicked
  $("#addLocationBtn").on("click", function () {
    console.log("clicked");

    loadLocationForm(() => {
      resetForm();
      $("#createLocationBtn").text("Create");
      $("#location-form-container").removeClass("hidden");
    });
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
        },
        error: function (xhr) {
          alert("Delete failed.");
          console.error(xhr.responseJSON || xhr.responseText);
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
