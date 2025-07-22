import { getCountryFlag } from "../../utils/helper.js";
import { loadEventsForLocation } from "../../main.js";
import { loadEventsForEventsPage } from "../../events/events.js";

const selected = sessionStorage.getItem("selectedLocation");

// loads/close the modal for location selection
export function loadLocationModal(): void {
  const modalContainer = $("#location-modal-container");
  modalContainer.empty();

  $.get("/components/location-modal/index.html")
    .done((html) => {
      modalContainer.html(html);

      const modal = $("#location-modal");
      const closeModal = $("#close-location-modal");
      const locationButton = $(".location-button");

      locationButton.on("click", () => {
        modal.removeClass("hidden").addClass("flex");
      });

      closeModal.on("click", () => {
        if (selected) {
          modal.removeClass("flex").addClass("hidden");
        }
      });

      modal.on("click", (e) => {
        if (e.target === modal[0] && selected) {
          modal.removeClass("flex").addClass("hidden");
        }
      });

      setupLocationLogic();
    })
    .fail((jqXHR, textStatus, errorThrown) => {
      console.error("Error loading location modal:", textStatus, errorThrown);
    });
}

interface Location {
  id: number;
  country: string;
  state: string;
  city: string;
  flag: string;
}

const locationArray: Location[] = [];

// sets up the logic for location selection
export function setupLocationLogic(): void {
  loadLocations(); // load locations below the searchbar in the modal

  const selected = sessionStorage.getItem("selectedLocation"); // check if a location is already selected

  if (!selected) {
    $("#location-modal").removeClass("hidden"); // if not, show the modal (user visits 1st time)
  } else {
    const loc: Location = JSON.parse(selected);

    const locationHtml = `
    <div class="w-[10.313rem] flex flex-row items-center justify-end gap-[0.375rem] cursor-pointer  ml-auto">
      <img
        class="w-[1.3rem] relative h-[1.3rem] overflow-hidden shrink-0"
        alt=""
        src="../../assets/images/Location.png"
      />
      <div class="relative text-base">${loc.city}</div>
      <img
        class="w-[1.3rem] relative h-[1.125rem] overflow-hidden shrink-0"
        alt=""
        src="${loc.flag}"
      />
    </div>
  `;

    setTimeout(() => {
      $("#navbar-location-display").html(locationHtml); // if yes, show the selected location in the navbar
    }, 1000);
  }

  const searchInput = $("#location-modal input");

  // filter the locations based on the search query
  searchInput.on("input", () => {
    const query = (searchInput.val() as string).toLowerCase();
    const filtered = locationArray.filter((loc) =>
      loc.city.toLowerCase().includes(query)
    );
    renderLocationGrid(filtered); // render the filtered locations in the grid
  });
}

// loads the locations alphabatically sorted
function loadLocations(): void {
  $.ajax({
    url: "http://127.0.0.1:8000/api/locations",
    method: "GET",
    success: function (data: any) {
      const locations = data.data as Location[];
      const enriched = locations.map((loc) => ({
        ...loc,
        flag: getCountryFlag(loc.country),
      }));

      enriched.sort((a, b) => a.city.localeCompare(b.city));

      locationArray.length = 0; // Clear the array first
      locationArray.push(...enriched);

      renderLocationGrid(locationArray);
    },
    error: function () {
      console.error("Failed to fetch locations.");
    },
  });
}

// renders the locations in the grid
function renderLocationGrid(locations: Location[]): void {
  const grid = $("#location-modal .grid");
  grid.empty();

  locations.forEach((loc) => {
    const div = $("<div></div>")
      .addClass("truncate cursor-pointer hover:text-purple-700")
      .text(loc.city)
      .attr("data-id", loc.id.toString())
      .on("click", () => {
        handleLocationSelect(loc);
      });

    grid.append(div);
  });
}

// handles the location selection
function handleLocationSelect(loc: Location): void {
  sessionStorage.setItem("selectedLocation", JSON.stringify(loc));

  // Trigger storage event manually so other tabs/pages can react
  localStorage.setItem("locationChangeTrigger", Date.now().toString());

  const locationHtml = `
    <div class="w-[10.313rem] flex flex-row items-center justify-end gap-[0.375rem] cursor-pointer ">
      <img
        class="w-[1.3rem] relative h-[1.3rem] overflow-hidden shrink-0"
        alt=""
        src="../../assets/images/Location.png"
      />
      <div class="relative text-base">${loc.city}</div>
      <img
        class="w-[1.3rem] relative h-[1.125rem] overflow-hidden shrink-0"
        alt=""
        src="${loc.flag}"
      />
    </div>
  `;

  $("#navbar-location-display").html(locationHtml);
  $("#location-modal").addClass("hidden");

  //  Immediately load events for selected location
  loadEventsForLocation();
  loadEventsForEventsPage();
}
