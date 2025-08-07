import {
  initLoader,
  showLoader,
  hideLoader,
} from "../components/loader/loader.js";

initLoader();

const button = document.getElementById("sign_in") as HTMLButtonElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

if (localStorage.getItem("auth-token")) {
  window.location.href = "/";
}

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

async function handleUserLogin(e?: Event) {
  e?.preventDefault();

  const email = emailInput?.value.trim();
  const password = passwordInput?.value;
  const error = document.getElementById("loginError") as HTMLElement;

  if (error) {
    error.textContent = "";
    error.classList.add("hidden");
  }

  if (!email || !password) {
    error.textContent = "Please fill in all fields.";
    error.classList.remove("hidden");
    return;
  }

  if (!validateEmail(email)) {
    error.textContent = "Not a valid Email";
    error.classList.remove("hidden");
    return;
  }

  if (password.length < 8) {
    error.textContent = "Minimum 8 digit password required";
    error.classList.remove("hidden");
    return;
  }

  showLoader();

  try {
    const response = await fetch("http://127.0.0.1:8000/api/auth/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const result = await response.json();
    console.log(result);

    if (!response.ok) {
      const errorMessages =
        Object.values(result.errors || {})
          .flat()
          .join("\n") || result.message;
      error.textContent = `Login failed:\n${errorMessages || "Unknown error"}`;
      error.classList.remove("hidden");
      return;
    }

    localStorage.setItem("auth-token", result.token);
    localStorage.setItem("User_details", JSON.stringify(result.data));

    window.location.href = "/";
  } catch (err) {
    console.error("Network or server error:", err);
    error.textContent = "Something went wrong. Please try again later.";
    error.classList.remove("hidden");
  } finally {
    hideLoader();
  }
}

// 🔘 Click event
button?.addEventListener("click", handleUserLogin);

// ⌨️ Enter key support
[emailInput, passwordInput].forEach((input) => {
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserLogin(e);
    }
  });
});
