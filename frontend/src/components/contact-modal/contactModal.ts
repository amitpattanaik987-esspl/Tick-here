import { initLoader, showLoader, hideLoader } from "../loader/loader.js";

initLoader();
export function loadContactModal(): void {
  const modalContainer = document.getElementById("contact-modal-container");

  fetch("/components/contact-modal/index.html")
    .then((response) => {
      if (!response.ok) throw new Error("Failed to fetch contact modal");
      return response.text();
    })
    .then((html) => {
      if (!modalContainer) return;
      modalContainer.innerHTML = html;

      const modal = document.getElementById("contact-modal") as HTMLDivElement;
      const closeModal = document.getElementById("close-modal") as HTMLButtonElement;
      const contactButtons = document.querySelectorAll(".contact-button");
      const form = document.getElementById("contact-form") as HTMLFormElement;
      const cancelBtn = document.getElementById("cancel-contact") as HTMLButtonElement;

      contactButtons.forEach((button) => {
        button.addEventListener("click", () => {
          modal.classList.remove("hidden");
          modal.classList.add("flex");
        });
      });

      const hideModal = () => {
        modal.classList.remove("flex");
        modal.classList.add("hidden");
      };

      closeModal.addEventListener("click", hideModal);
      cancelBtn?.addEventListener("click", hideModal);
      modal.addEventListener("click", (e: MouseEvent) => {
        if (e.target === modal) hideModal();
      });

      // 🔽 Add this part to handle form submission
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const formData = new FormData(form);

        const data = {
          name: formData.get("name"),
          email: formData.get("email"),
          country_code: formData.get("country_code"),
          phone: formData.get("phone"),
          city: formData.get("city"),
          state: formData.get("state"),
          description: formData.get("description"),
        };

        showLoader();
        try {
          const response = await fetch("http://127.0.0.1:8000/api/contact", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json",
              Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const errorData = await response.json();
            console.error("Server Error Response:", response.status, errorData);
            alert(errorData?.message || "Something went wrong.");
            return;
          };

          const result = await response.json();
          alert("Message sent successfully! Our support will contact you soon.");
          form.reset();
          hideModal();
          hideLoader();
        } catch (error) {
          console.error("Submission error:", error);
          alert("Something went wrong. Please try again.");
          hideLoader();
        }
      });
    })
    .catch((error) => {
      console.error("Error loading contact modal:", error);
      hideLoader();
    });
}
