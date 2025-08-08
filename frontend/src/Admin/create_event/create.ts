import {
  hideLoader,
  initLoader,
  showLoader,
} from "../../components/loader/loader.js";
import { loadNavbar } from "../components/admin_navbar/navbar.js";

type VenueEntry = {
  id: number;
  venue: string;
  date: string;
  time: string;
};

let savedVenues: VenueEntry[] = [];
let currentVenueId = 0;
let selectedImage: File | null = null;
let previewImageDataUrl = "";

function fetchCategories() {
  fetch("http://127.0.0.1:8000/api/categories")
    .then((res) => res.json())
    .then((data) => {
      if (data.success && Array.isArray(data.data)) {
        const optionsContainer = document.getElementById("categoryOptions")!;
        optionsContainer.innerHTML = ""; // Clear old options

        data.data.forEach((category: { id: number; name: string }) => {
          const option = document.createElement("div");
          option.className =
            "p-2 hover:bg-gradient-to-r hover:from-[#46006e] to-[#0a0417] hover:text-white cursor-pointer";
          option.textContent = category.name;
          option.dataset.id = category.id.toString();

          option.addEventListener("click", () => {
            // Set hidden input value
            const hiddenInput = document.getElementById(
              "category"
            ) as HTMLInputElement;
            hiddenInput.value = category.id.toString();

            // Set visible text
            const selectedText = document.getElementById(
              "selectedCategoryText"
            )!;
            selectedText.textContent = category.name;

            // Hide dropdown
            optionsContainer.classList.add("hidden");
          });

          optionsContainer.appendChild(option);
        });
      } else {
        console.error("Failed to fetch categories:", data);
      }
    })
    .catch((err) => {
      console.error("Error fetching categories:", err);
    });
}

let allVenues: {
  id: number;
  venue_name: string;
  location: { id: number; city: string };
}[] = [];

async function fetchVenues(onFinish?: () => void) {
  showLoader();

  const token = localStorage.getItem("admin_token");
  if (!token) return;

  let nextPageUrl: string | null =
    "http://127.0.0.1:8000/api/admin/venues?page=1";
  const collected: typeof allVenues = [];

  while (nextPageUrl) {
    const response = await fetch(nextPageUrl, {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();
    if (data.success && Array.isArray(data.data.data)) {
      collected.push(...data.data.data);
      nextPageUrl = data.data.next_page_url;
    } else {
      break;
    }
  }

  allVenues = collected;
  renderVenueOptions(allVenues);

  if (onFinish) onFinish(); // call callback if passed
  hideLoader();
}

function renderVenueOptions(
  venues: { id: number; venue_name: string; location: { city: string } }[]
) {
  const optionsContainer = document.getElementById("venueOptions")!;
  optionsContainer.innerHTML = "";

  venues.forEach((venue) => {
    const option = document.createElement("div");
    option.className =
      "flex justify-between p-2 hover:bg-gradient-to-r hover:from-[#46006e] to-[#0a0417] hover:text-white cursor-pointer";
    option.dataset.id = venue.id.toString();

    // Create first div (e.g., venue name)
    const venueDiv = document.createElement("div");
    venueDiv.textContent = venue.venue_name;

    // Create second div (e.g., location name)
    const cityDiv = document.createElement("div");
    cityDiv.textContent = venue.location.city;
    cityDiv.className = "text-sm text-gray-500";

    // Append both divs to option
    option.appendChild(venueDiv);
    option.appendChild(cityDiv);

    option.addEventListener("click", () => {
      const input = document.getElementById(
        "venueSearchInput"
      ) as HTMLInputElement;
      const hiddenInput = document.getElementById("venue") as HTMLInputElement;
      input.value = venue.venue_name;
      hiddenInput.value = venue.id.toString();

      optionsContainer.classList.add("hidden");
    });

    optionsContainer.appendChild(option);
  });

  optionsContainer.classList.remove("hidden");
}

function setupVenueSearch() {
  const input = document.getElementById("venueSearchInput") as HTMLInputElement;

  input.addEventListener("input", () => {
    const query = input.value.toLowerCase();
    const filtered = allVenues.filter(
      (v) =>
        v.venue_name.toLowerCase().includes(query) ||
        v.location.city.toLowerCase().includes(query)
    );
    renderVenueOptions(filtered);
  });

  input.addEventListener("focus", () => {
    renderVenueOptions(allVenues);
  });

  document.addEventListener("click", (e) => {
    const dropdown = document.getElementById("customVenueDropdown")!;
    const options = document.getElementById("venueOptions")!;
    if (!dropdown.contains(e.target as Node)) {
      options.classList.add("hidden");
    }
  });
}

function showImageModal(imgSrc: string) {
  const modal = document.getElementById("imagePreviewModal")!;
  const img = document.getElementById("modalPreviewImage") as HTMLImageElement;
  img.src = imgSrc;
  modal.classList.remove("hidden");
}

const closeModalBtn = document.getElementById("closeImageModal")!;

closeModalBtn.addEventListener("click", () => {
  document.getElementById("imagePreviewModal")!.classList.add("hidden");
});

document.addEventListener("DOMContentLoaded", async () => {
  await initLoader();

  loadNavbar();

  fetchCategories();

  fetchVenues(() => {
    // load prefilled data in editing mode
    const editDataRaw = localStorage.getItem("edit_event_data");

    if (editDataRaw) {
      showLoader();
      const eventData = JSON.parse(editDataRaw);
      localStorage.setItem("edit_event_data_backup", JSON.stringify(eventData));

      const isPartial = eventData.__edit_mode === "partial";

      // Prefill basic fields
      (document.getElementById("title") as HTMLInputElement).value =
        eventData.title;
      (document.getElementById("description") as HTMLTextAreaElement).value =
        eventData.description;
      (document.getElementById("category") as HTMLSelectElement).value =
        eventData.category_id.toString();
      (document.getElementById("duration") as HTMLInputElement).value =
        eventData.duration;

      const selectedText = document.getElementById("selectedCategoryText")!;
      selectedText.textContent = eventData.category?.name || "";

      // Set image preview
      if (eventData.thumbnail) {
        previewImageDataUrl = `http://127.0.0.1:8000/storage/${eventData.thumbnail}`;
        imageUploadArea.innerHTML = `<img src="${previewImageDataUrl}" alt="Preview" class="max-w-full max-h-full object-contain rounded cursor-pointer">`;

        // Make modal work too
        const previewImg = imageUploadArea.querySelector("img")!;
        previewImg.addEventListener("click", () =>
          showImageModal(previewImageDataUrl)
        );
      }

      // Prefill venues only if full edit
      if (!isPartial) {
        savedVenues = eventData.event_venue.map((venue: any, index: number) => {
          const dateTime = new Date(venue.start_datetime);
          return {
            id: index + 1,
            venue: venue.venue_id.toString(),
            date: dateTime.toISOString().slice(0, 10),
            time: dateTime.toTimeString().slice(0, 5),
          };
        });

        currentVenueId = savedVenues.length;
        renderSavedVenues();
      }

      // Disable venue editing if partial mode
      if (isPartial) {
        const venueBlock = document.getElementById("venueBlock")!;
        const toggleVenueBtn = document.getElementById("toggleVenueBtn")!;
        venueBlock.classList.add("hidden");
        toggleVenueBtn.classList.add("hidden");
        savedVenuesList.innerHTML = `<div class="text-gray-500 p-3 italic">
          Venue editing is disabled because tickets are already booked for this active event.
        </div>`;
      }

      // Change submit button text
      submitFormBtn.textContent = isPartial ? "Update Event Info" : "Update ";

      // Remove the data after use
      localStorage.removeItem("edit_event_data");
    }

    hideLoader();
  });

  setupVenueSearch();

  // for custom category select field
  const categoryDropdown = document.getElementById("customCategoryDropdown")!;
  const categoryOptionsBox = document.getElementById("categoryOptions")!;

  categoryDropdown.addEventListener("click", () => {
    categoryOptionsBox.classList.toggle("hidden");
  });

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (!categoryDropdown.contains(e.target as Node)) {
      categoryOptionsBox.classList.add("hidden");
    }
  });

  // for custom venue field
  const venueDropdown = document.getElementById("customVenueDropdown")!;
  const venueOptionsBox = document.getElementById("venueOptions")!;

  venueDropdown.addEventListener("click", () => {
    venueOptionsBox.classList.toggle("hidden");
  });

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (!venueDropdown.contains(e.target as Node)) {
      venueOptionsBox.classList.add("hidden");
    }
  });

  const venueBlock = document.getElementById("venueBlock") as HTMLDivElement;
  const savedVenuesList = document.getElementById(
    "savedVenuesList"
  ) as HTMLDivElement;
  const submitFormBtn = document.getElementById(
    "submitFormBtn"
  ) as HTMLButtonElement;
  const toggleVenueBtn = document.getElementById(
    "toggleVenueBtn"
  ) as HTMLButtonElement;
  const closeVenueBtn = document.getElementById(
    "closeVenueBtn"
  ) as HTMLButtonElement;
  const cancelBtn = document.getElementById("cancelBtn") as HTMLButtonElement;

  const venueInput = document.getElementById("venue") as HTMLSelectElement;
  const dateInput = document.getElementById("on-date") as HTMLInputElement;
  const timeInput = document.getElementById("time") as HTMLInputElement;

  const imageUploadArea = document.querySelector(
    ".border-dashed"
  ) as HTMLDivElement;
  const imageLink = imageUploadArea.querySelector("a") as HTMLAnchorElement;

  //Image Upload
  const hiddenFileInput = document.createElement("input");
  hiddenFileInput.type = "file";
  hiddenFileInput.accept = "image/*";

  hiddenFileInput.addEventListener("change", (e) => {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files[0]) {
      selectedImage = target.files[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        previewImageDataUrl = e.target?.result as string;

        imageUploadArea.innerHTML = `<img src="${previewImageDataUrl}" alt="Preview" class="max-w-full max-h-full object-contain rounded cursor-pointer">`;

        // Add click to open modal
        const previewImg = imageUploadArea.querySelector("img")!;
        previewImg.addEventListener("click", () =>
          showImageModal(previewImageDataUrl)
        );
      };
      reader.readAsDataURL(selectedImage);
    }
  });

  imageLink.addEventListener("click", (e) => {
    e.preventDefault();
    hiddenFileInput.click();
  });

  imageUploadArea.addEventListener("click", (e) => {
    const target = e.target as HTMLElement;
    if (target.tagName.toLowerCase() === "img") return; //  Don't open file input
    hiddenFileInput.click(); //  Open file manager only when clicking elsewhere
  });

  //Venue
  toggleVenueBtn.addEventListener("click", () => {
    const spanText = toggleVenueBtn.querySelector("span")!;

    if (venueBlock.classList.contains("hidden")) {
      venueBlock.classList.remove("hidden");
      spanText.textContent = "Save Venue";
    } else {
      if (trySaveVenue()) {
        venueBlock.classList.add("hidden");
        spanText.textContent = "Add Venue";
      }
    }
  });

  closeVenueBtn.addEventListener("click", () => {
    venueBlock.classList.add("hidden");
    toggleVenueBtn.textContent = "Add Venue";
    clearVenueForm();
  });

  submitFormBtn.addEventListener("click", async () => {
    showLoader();

    // Auto-save venue if block is visible and partially filled
    if (!venueBlock.classList.contains("hidden")) {
      const hasSomeInput =
        venueInput.value !== "Select" ||
        dateInput.value ||
        timeInput.value !== "09:00";

      if (hasSomeInput) {
        if (
          !venueInput.value ||
          venueInput.value === "Select" ||
          !dateInput.value ||
          !timeInput.value
        ) {
          alert("Please complete venue fields or close the venue form.");
          hideLoader();
          return;
        }

        trySaveVenue(); // Save the venue before proceeding
      }
    }

    const title = (document.getElementById("title") as HTMLInputElement).value;
    const description = (
      document.getElementById("description") as HTMLTextAreaElement
    ).value;
    const category = (document.getElementById("category") as HTMLSelectElement)
      .value;
    const duration = (document.getElementById("duration") as HTMLInputElement)
      .value;

    if (!title || !description || !category || !duration) {
      alert("Please fill all required fields.");
      hideLoader();
      return;
    }

    const isValid = /^\d{1,2}:\d{1,2}:\d{1,2}$/.test(duration);
    if (!isValid) {
      alert("Please enter duration in H:m:s format (e.g. 1:30:00)");
      hideLoader();
      return;
    }

    const formData = new FormData();
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category_id", category);
    formData.append("duration", duration);

    const editDataRaw = localStorage.getItem("edit_event_data_backup");
    const isEditing = !!editDataRaw;

    if (!isEditing) {
      if (selectedImage) {
        formData.append("thumbnail", selectedImage);
      } else {
        alert("Please attach an image.");
        hideLoader();
        return;
      }
    } else {
      if (selectedImage) {
        formData.append("thumbnail", selectedImage);
      }
    }

    savedVenues.forEach((venue, index) => {
      formData.append(`venues[${index}][venue_id]`, venue.venue);

      const found = allVenues.find((v) => v.id.toString() === venue.venue);
      const locationId = found?.location?.id;

      formData.append(
        `venues[${index}][location_id]`,
        locationId ? String(locationId) : ""
      );

      formData.append(
        `venues[${index}][start_datetime]`,
        `${venue.date} ${venue.time}`
      );
    });

    const token = localStorage.getItem("admin_token") || "";

    try {
      const editData = isEditing ? JSON.parse(editDataRaw) : null;

      const endpoint = isEditing
        ? `http://127.0.0.1:8000/api/admin/events/${editData.id}`
        : "http://127.0.0.1:8000/api/admin/create-event";

      formData.append("_method", isEditing ? "PUT" : "POST"); // Laravel's method spoofing

      if (isEditing && editData.__edit_mode === "partial") {
        formData.delete("venues"); // No venue updates
      }

      if (isEditing) {
        formData.append("__edit_mode", editData.__edit_mode);
      }

      if (
        (!isEditing || editData.__edit_mode !== "partial") &&
        savedVenues.length === 0
      ) {
        alert("Please add at least one venue.");
        hideLoader();
        return;
      }

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json();
        console.error("Error response:", data);

        if (data.errors && typeof data.errors === "object") {
          // Gather all error messages
          const messages: string[] = [];
          for (const field in data.errors) {
            if (Array.isArray(data.errors[field])) {
              messages.push(...data.errors[field]);
            }
          }

          alert(messages.join("\n")); // Show all errors in alert box
        } else if (data.message) {
          alert(`Failed: ${data.message}`);
        } else {
          alert("Unknown error occurred.");
        }

        return;
      }

      isEditing
        ? alert("Event updated successfully!")
        : alert("Event created successfully!");

      window.location.href = "/admin/manage-event/";
    } catch (err) {
      console.error("API Exception:", err);
      alert("API error, check console.");
    } finally {
      localStorage.removeItem("edit_event_data_backup");
      hideLoader();
    }
  });


  cancelBtn.addEventListener("click", () => {
    (document.getElementById("title") as HTMLInputElement).value = "";
    (document.getElementById("description") as HTMLTextAreaElement).value = "";
    (document.getElementById("category") as HTMLSelectElement).value = "";
    (document.getElementById("duration") as HTMLInputElement).value = "1";
    venueInput.value = "Select";
    dateInput.value = "";
    timeInput.value = "09:00";

    selectedImage = null;
    imageUploadArea.innerHTML = `
      <i class="fa-solid fa-image text-3xl text-gray-400 mb-2"></i>
      <p class="text-sm text-gray-500">
        Drop here to attach or
        <a href="#" class="text-blue-500 underline">upload</a>
      </p>
    `;

    venueBlock.classList.add("hidden");
    savedVenues = [];
    currentVenueId = 0;
    savedVenuesList.innerHTML = "";

    const editDataRaw = localStorage.getItem("edit_event_data_backup");
    const isEditing = !!editDataRaw;

    if (isEditing) {
      window.location.href = "/admin/manage-event/";
      localStorage.removeItem("edit_event_data_backup");
    } else {
      window.location.href = "/admin/";
    }
  });

  function trySaveVenue(): boolean {
    const venueInput = document.getElementById("venue") as HTMLSelectElement;
    const dateInput = document.getElementById("on-date") as HTMLInputElement;
    const timeInput = document.getElementById("time") as HTMLInputElement;

    if (!venueInput || !dateInput || !timeInput) {
      alert("Venue form not ready yet.");
      return false;
    }

    if (dateInput.value < new Date().toISOString().split("T")[0]) {
      alert("Date cannot be in the past.");
      return false;
    }

    const venue = venueInput.value;
    const date = dateInput.value;
    const time = timeInput.value;

    if (!venue || venue === "Select" || !date || !time) {
      alert("Please fill all venue fields.");
      return false;
    }

    savedVenues.push({
      id: ++currentVenueId,
      venue,
      date,
      time,
    });

    clearVenueForm();
    renderSavedVenues();
    return true;
  }

  function clearVenueForm() {
    const venueInput = document.getElementById(
      "venue"
    ) as HTMLInputElement | null;
    const dateInput = document.getElementById(
      "on-date"
    ) as HTMLInputElement | null;
    const timeInput = document.getElementById(
      "time"
    ) as HTMLInputElement | null;

    if (venueInput) venueInput.value = "Select";
    if (dateInput) dateInput.value = "";
    if (timeInput) timeInput.value = "09:00";
  }

  function renderSavedVenues() {
    savedVenuesList.innerHTML = "";

    console.log(savedVenues);

    savedVenues.forEach((entry) => {
      const venueName =
        allVenues.find((v) => v.id.toString() === entry.venue)?.venue_name ||
        `Venue #${entry.venue}`;
      const container = document.createElement("div");
      container.className =
        "border border-gray-300 bg-white rounded-md p-4 flex justify-between items-center shadow";

      const details = document.createElement("div");
      details.innerHTML = `

       <p class="font-medium text-sm mb-1">${venueName}</p>
        <p class="text-sm text-gray-600">Date: ${entry.date}</p>
        <p class="text-sm text-gray-600">Time: ${entry.time}</p>
      `;

      const actions = document.createElement("div");
      actions.className = "w-[10rem] p-3 flex gap-2 justify-between";

      const editBtn = document.createElement("button");
      editBtn.textContent = "Edit";
      editBtn.className =
        " bg-gradient-to-r from-[#46006e] to-[#0a0417] text-white h-[1.625rem] w-16  px-3 py-1 flex justify-center items-center rounded hover:cursor-pointer";
      editBtn.addEventListener("click", () => {
        venueInput.value = entry.venue;
        dateInput.value = entry.date;
        timeInput.value = entry.time;

        savedVenues = savedVenues.filter((v) => v.id !== entry.id);

        renderSavedVenues();
        venueBlock.classList.remove("hidden");
        const spanText = toggleVenueBtn.querySelector("span")!;
        spanText.textContent = "Save Venue";
      });

      const deleteBtn = document.createElement("button");
      deleteBtn.textContent = "Delete";
      deleteBtn.className =
        "border border-[#191970] text-xs text-[#404040] flex items-center px-3 py-1 rounded h-[1.625rem] hover:cursor-pointer";
      deleteBtn.addEventListener("click", () => {
        savedVenues = savedVenues.filter((v) => v.id !== entry.id);
        renderSavedVenues();
      });

      actions.appendChild(editBtn);
      actions.appendChild(deleteBtn);

      container.appendChild(details);
      container.appendChild(actions);

      savedVenuesList.appendChild(container);
    });
  }
});
