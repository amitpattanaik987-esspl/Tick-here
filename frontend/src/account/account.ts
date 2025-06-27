import { loadContactModal } from "../components/contact-modal/contactModal.js";
import { loadNavbar } from "../components/navbar/navbar.js";

document.addEventListener('DOMContentLoaded', function () {
    loadNavbar();
    loadContactModal();

    const username = localStorage.getItem("username");

    if (username) {
        fetch("http://127.0.0.1:8000/api/auth/user/profile", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ username })
        })
        .then((res) => res.json())
        .then((data) => {
            const user = data.user;
            const nameInput = document.getElementById("name") as HTMLInputElement | null;
            const emailInput = document.getElementById("email") as HTMLInputElement | null;
            const phoneInput = document.getElementById("phone") as HTMLInputElement | null;
            const usernameInput = document.getElementById("username") as HTMLInputElement | null;
            const name=document.getElementById("name_inner") as HTMLInputElement|null
            const email=document.getElementById("email_inner") as HTMLInputElement|null
            if (user) {
                if (nameInput) nameInput.value = user.name || '';
                if (emailInput) emailInput.value = user.email || '';
                if (phoneInput) phoneInput.value = user.phone || 'NULL';
                if (usernameInput) usernameInput.value = user.username || '';
                if(name) name.textContent=user.name||"";
                if(email) email.textContent=user.email||"";
            }

        })
        .catch((err) => {
            console.error("Error loading user profile:", err);
        });
    }
});

const modal = document.getElementById("passwordModal")!;
const changePasswordLink = document.querySelector("a[href='']")!;
const cancelBtn = document.getElementById("cancelBtn")!;
const changePasswordForm = document.getElementById("changePasswordForm") as HTMLFormElement;

// Show modal
changePasswordLink.addEventListener("click", (e) => {
  e.preventDefault();
  modal.classList.remove("hidden");
  modal.classList.add("flex");
});

// Hide modal
cancelBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  changePasswordForm.reset();
});

// Submit form
changePasswordForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const username = localStorage.getItem("username");

  const formData = new FormData(changePasswordForm);
  const payload = {
    username,
    current_password: formData.get("current_password"),
    new_password: formData.get("new_password"),
    confirm_password: formData.get("confirm_password"),
  };

  fetch("http://127.0.0.1:8000/api/auth/user/change-password", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  })
    .then((res) => res.json())
    .then((data) => {
      alert(data.message || "Password updated.");
      modal.classList.add("hidden");
      changePasswordForm.reset();
    })
    .catch((err) => {
      console.error("Error:", err);
      alert("Failed to change password.");
    });
});


//Handle Edit Button 

const editSaveBtn = document.getElementById("editSaveBtn") as HTMLButtonElement;
let isEditing = false;

editSaveBtn.addEventListener("click", () => {
    const nameInput = document.getElementById("name") as HTMLInputElement;
    const emailInput = document.getElementById("email") as HTMLInputElement;
    const phoneInput = document.getElementById("phone") as HTMLInputElement;
    const usernameInput = document.getElementById("username") as HTMLInputElement;

    if (!isEditing) {
        // Switch to edit mode
        nameInput.readOnly = false;
        emailInput.readOnly = false;
        phoneInput.readOnly = false;
        usernameInput.readOnly = false;

        nameInput.classList.remove("bg-[#B0BAC366]");
        nameInput.classList.remove("outline-none");

        emailInput.classList.remove("bg-[#B0BAC366]");
        emailInput.classList.remove("outline-none");

        phoneInput.classList.remove("bg-[#B0BAC366]");
        phoneInput.classList.remove("outline-none");

        usernameInput.classList.remove("bg-[#B0BAC366]");
        usernameInput.classList.remove("outline-none");

        nameInput.classList.add("outline-blue-400")
        nameInput.classList.add("bg-[#d6e2ec66]")

        emailInput.classList.add("outline-blue-400")
        emailInput.classList.add("bg-[#d6e2ec66]")

        phoneInput.classList.add("outline-blue-400")
        phoneInput.classList.add("bg-[#d6e2ec66]")

        usernameInput.classList.add("outline-blue-400")
        usernameInput.classList.add("bg-[#d6e2ec66]")

        editSaveBtn.textContent = "Save";
        isEditing = true;
    } else {
        // Save updated info
        const username = localStorage.getItem("username");

        const updatedUser = {
            username,
            name: nameInput.value,
            email: emailInput.value,
            phone: phoneInput.value,
            new_username: usernameInput.value,
        };

        fetch("http://127.0.0.1:8000/api/auth/user/profile", {
            method: "PUT", 
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(updatedUser),
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message || "Profile updated.");

                // Back to readonly
                nameInput.readOnly = true;
                emailInput.readOnly = true;
                phoneInput.readOnly = true;
                usernameInput.readOnly = true;

                nameInput.classList.add("bg-[#B0BAC366]");
                emailInput.classList.add("bg-[#B0BAC366]");
                phoneInput.classList.add("bg-[#B0BAC366]");
                usernameInput.classList.add("bg-[#B0BAC366]");

                editSaveBtn.textContent = "Edit";
                isEditing = false;

                // Also update the top labels
                const nameLabel = document.getElementById("name_inner");
                const emailLabel = document.getElementById("email_inner");
                if (nameLabel) nameLabel.textContent = nameInput.value;
                if (emailLabel) emailLabel.textContent = emailInput.value;

                // Update localStorage username if it was changed
                localStorage.setItem("username", updatedUser.new_username);
            })
            .catch(err => {
                console.error("Error updating profile:", err);
                alert("Failed to update profile.");
            });
    }
});
