// Import your components (adjust paths as needed)
import { loadNavbar } from "../components/admin_navbar/navbar.js";

// Define TypeScript interfaces for expected API response types
interface AdminProfile {
  id: number;
  name: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
}

let editMode = false;

async function loadActiveAdmins(currentAdminId: string | null) {
  const adminList = document.getElementById("adminList");
  const token = localStorage.getItem("admin_token");

  try {
    const res = await fetch("http://127.0.0.1:8000/api/admin/active", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    const activeAdmins = await res.json();

    if (adminList) {
      adminList.innerHTML = ""; // Clear the list

      console.log(activeAdmins);

      activeAdmins.data.forEach((admin: any) => {
        if (admin.id.toString() !== currentAdminId) {
          const li = document.createElement("li");
          li.className = "flex items-center gap-3";
          li.innerHTML = `
            <img src="https://i.pravatar.cc/100" alt="Avatar of ${admin.name}" class="w-10 h-10 rounded-full border" />
            <span>${admin.name}</span>
            <div class="flex gap-3 ml-auto">
              <div class="flex gap-3 ml-auto">
  <i class="fa-regular fa-pen-to-square cursor-pointer edit-admin-btn" data-id="${admin.id}" data-name="${admin.name}" data-username="${admin.username}" data-email="${admin.email}" data-phone="${admin.phone}"></i>
  <i class="fa-solid fa-user-xmark cursor-pointer delete-admin-btn" data-id="${admin.id}"></i>
</div>

            </div>
          `;

          adminList.appendChild(li);
        }
      });
    }
  } catch (error) {
    console.error("Failed to fetch active admins:", error);
  }
}

// Wait for the DOM to load
document.addEventListener("DOMContentLoaded", async () => {
  // Load common UI components
  try {
    loadNavbar();
  } catch (error) {
    console.error("Component load error:", error);
  }

  const token = localStorage.getItem("admin_token");
  const adminId = localStorage.getItem("admin_info");

  if (!token) {
    alert("You are not authenticated.");
    return;
  }

  // Get references to DOM elements
  const nameEl = document.getElementById("adminName");
  const usernameEl = document.getElementById("adminUsername");
  const fullNameInput = document.getElementById(
    "adminFullName"
  ) as HTMLInputElement;
  const userNameInput = document.getElementById(
    "adminUserName"
  ) as HTMLInputElement;
  const emailInput = document.getElementById("adminEmail") as HTMLInputElement;
  const phoneInput = document.getElementById("adminPhone") as HTMLInputElement;

  // Fetch and apply admin profile
  try {
    const profileResponse = await fetch(
      "http://127.0.0.1:8000/api/auth/admin/profile",
      {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!profileResponse.ok) throw new Error("Profile fetch failed");

    const resJson = await profileResponse.json();

    const profile: AdminProfile = resJson.admin;

    localStorage.setItem("admin_info", profile.id.toString());

    if (nameEl) nameEl.textContent = profile.name;
    if (usernameEl) usernameEl.textContent = profile.username;
    if (fullNameInput) fullNameInput.value = profile.name;
    if (userNameInput) userNameInput.value = profile.username;
    if (emailInput) emailInput.value = profile.email;
    if (phoneInput) phoneInput.value = profile.phone;
  } catch (error) {
    console.error("Failed to fetch admin profile:", error);
  }

  // Fetch and render active admins
  const currentAdminId = localStorage.getItem("admin_info");
  loadActiveAdmins(currentAdminId);

  // handle edit admin details
  const editBtn = document.getElementById(
    "editProfileBtn"
  ) as HTMLButtonElement;

  let isEditing = false;

  editBtn.addEventListener("click", async () => {
    if (!isEditing) {
      // Switch to edit mode
      isEditing = true;
      editBtn.textContent = "Save Profile";

      [fullNameInput, userNameInput, emailInput, phoneInput].forEach(
        (input) => {
          input.readOnly = false;
          input.classList.remove("bg-gray-100");
          input.classList.add("bg-white");
        }
      );
    } else {
      // Switch to view mode and update
      isEditing = false;
      editBtn.textContent = "Edit Profile";

      [fullNameInput, userNameInput, phoneInput].forEach((input) => {
        input.readOnly = false;
        input.classList.remove("bg-gray-100");
        input.classList.add("bg-white");
      });

      // Keep email readonly
      emailInput.readOnly = true;
      emailInput.classList.add("bg-gray-100", "text-gray-400", "cursor-not-allowed");
      emailInput.classList.remove("bg-white");

      // Send update request

      try {
        const res = await fetch(`http://127.0.0.1:8000/api/auth/admin/profile`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            full_name: fullNameInput.value.trim(),
            username: userNameInput.value.trim(),
            email: emailInput.value.trim(),
            phone: phoneInput.value.trim(),
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          const firstField = Object.keys(data.errors)[0];
          const firstError = data.errors[firstField][0];
          throw new Error(firstError || "Update failed");
        }

        alert("Profile updated successfully.");
      } catch (err) {
        console.error("Update error:", err);
        alert(err.message || "Failed to update profile.");
      }

    }
  });

  // handle add admin modal
  const addAdmin = document.getElementById("addAdmin");
  const modal = document.getElementById("addAdminModal");

  if (addAdmin && modal) {
    addAdmin.addEventListener("click", () => {
      if (adminId !== "1") {
        alert("You are not authorized to add admin.");
        return;
      }
      console.log("Add Admin clicked");
      modal.classList.remove("hidden");

      // Reset form fields
      (document.getElementById("addAdminForm") as HTMLFormElement).reset();

      // Clear editing ID
      const editingField = document.getElementById(
        "editingAdminId"
      ) as HTMLInputElement;
      if (editingField) editingField.value = "";

      // Reset button and title
      const submitBtn = document.getElementById("submitFormBtn");
      if (submitBtn) submitBtn.textContent = "Create";

      const titleEl = document.getElementById("addAdminModalTitle");
      if (titleEl) titleEl.textContent = "Add New Admin";

      // Reset password field and username field visibility
      document.getElementById("passwordDiv")?.classList.remove("hidden");
      document.getElementById("usernameDiv")?.classList.add("hidden");

      // Clear editMode flag
      editMode = false;
    });
  }

  // Cancel and close buttons
  const closeAdminModal = document.getElementById("closeAdminModal");
  const cancelBtn = document.getElementById("cancelBtn");

  [closeAdminModal, cancelBtn].forEach((btn) => {
    if (btn && modal) {
      btn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }
  });

  // handle add admin form
  const submitBtn = document.getElementById("submitFormBtn");
  if (submitBtn) {
    submitBtn?.addEventListener("click", async () => {
      const name = (
        document.getElementById("newAdminName") as HTMLInputElement
      ).value.trim();
      const username = (
        document.getElementById("newAdminUserName") as HTMLInputElement
      ).value.trim();
      const email = (
        document.getElementById("newAdminEmail") as HTMLInputElement
      ).value.trim();
      const phone = (
        document.getElementById("newAdminPhone") as HTMLInputElement
      ).value.trim();
      const password = (
        document.getElementById("newAdminPassword") as HTMLInputElement
      ).value.trim();
      const editingId = (
        document.getElementById("editingotherAdminId") as HTMLInputElement
      ).value;

      const token = localStorage.getItem("admin_token");

      const payload: any = { name, username, email, phone };
      if (!editingId && password) payload.password = password;
      console.log(payload);

      try {
        const url = editingId
          ? `http://127.0.0.1:8000/api/auth/admin/profile/${editingId}`
          : "http://127.0.0.1:8000/api/admin";

        const method = editingId ? "PUT" : "POST";

        const res = await fetch(url, {
          method,
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok) {
          if (data.errors && Object.keys(data.errors).length > 0) {
            const firstField = Object.keys(data.errors)[0];
            const firstError = data.errors[firstField]?.[0];
            throw new Error(firstError || "Request failed");
          } else if (data.message) {
            throw new Error(data.message);
          } else {
            throw new Error("Request failed");
          }
        }

        //throw new Error(data.message || "Request failed"); //hello

        alert(
          editingId
            ? "Admin updated successfully"
            : "Admin created successfully"
        );

        (document.getElementById("addAdminForm") as HTMLFormElement)?.reset();
        (document.getElementById("editingAdminId") as HTMLInputElement).value =
          "";
        submitBtn.textContent = "Create";

        // Reset modal
        (document.getElementById("addAdminModal") as HTMLElement).setAttribute(
          "hidden",
          ""
        );


        // Refresh admin list
        loadActiveAdmins(localStorage.getItem("admin_info"));
      } catch (err: any) {
        console.error("Submit error:", err);
        alert(err.message || "Something went wrong.");
      }
    });
  }

  // handle edit / delete other admins
  document.addEventListener("click", async (event) => {
    const target = event.target as HTMLElement;

    // Edit Logic
    if (target.classList.contains("edit-admin-btn")) {
      editMode = true;

      if (editMode) {
        if (adminId !== "1") {
          alert("You are not authorized to edit other admins");
          return;
        }

        const otherAdminId = target.dataset.id;
        const name = target.dataset.name || "";
        const username = target.dataset.username || "";
        const email = target.dataset.email || "";
        const phone = target.dataset.phone || "";

        // Fill form with admin data
        (document.getElementById("newAdminName") as HTMLInputElement).value =
          name;
        (
          document.getElementById("newAdminUserName") as HTMLInputElement
        ).value = username;
        (document.getElementById("newAdminEmail") as HTMLInputElement).value =
          email;
        (document.getElementById("newAdminPhone") as HTMLInputElement).value =
          phone;
        (
          document.getElementById("newAdminPassword") as HTMLInputElement
        ).value = ""; // leave blank
        (
          document.getElementById("editingotherAdminId") as HTMLInputElement
        ).value = otherAdminId || "";

        // Switch button text
        const submitBtn = document.getElementById("submitFormBtn")!;
        submitBtn.textContent = "Update";
        document.getElementById("addAdminModalTitle")!.textContent =
          "Edit Admin";

        // Show modal
        document.getElementById("addAdminModal")?.classList.remove("hidden");
        document.getElementById("usernameDiv")?.classList.remove("hidden");
        document.getElementById("passwordDiv")?.classList.add("hidden");
      }
    }

    // Delete Logic
    if (target.classList.contains("delete-admin-btn")) {
      if (adminId !== "1") {
        alert("You are not authorized to delete other admins");
        return;
      }
      const otherAdminId = target.dataset.id;
      const confirmed = confirm("Are you sure you want to delete this admin?");
      if (!confirmed || !otherAdminId) return;

      const token = localStorage.getItem("admin_token");

      try {
        const res = await fetch(
          `http://127.0.0.1:8000/api/auth/admin/profile/${otherAdminId}`,
          {
            method: "DELETE",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await res.json();

        if (!res.ok) throw new Error(data.message || "Failed to delete admin");

        alert("Admin deleted successfully");
        loadActiveAdmins(localStorage.getItem("admin_info"));
      } catch (err) {
        console.error("Delete error:", err);
        alert("Failed to delete admin.");
      }
    }
  });
});
