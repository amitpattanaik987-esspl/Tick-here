import { initLoader, showLoader, hideLoader } from "../components/loader/loader.js";

initLoader();

const button = document.getElementById("sign_in") as HTMLButtonElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

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

  if (!email || !password) {
    alert("Please fill in both email and password.");
    return;
  }

  if (!validateEmail(email)) {
    alert("Invalid email");
    return;
  }

  if (password.length < 8) {
    alert("Minimum 8 digit password required");
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

    if (!response.ok) {
      const error = await response.json();
      alert(`Login failed: ${error.message || "Unknown error"}`);
      console.log(error);
      return;
    }

    const result = await response.json();
    console.log("Login success:", result);

    localStorage.setItem('auth-token', result.token);
    localStorage.setItem('User_details', JSON.stringify(result.data));

    window.location.href = '/';

  } catch (error) {
    console.error("Network or server error:", error);
    alert("Something went wrong. Please try again.");
  } finally {
    hideLoader();
  }
}

// 🔘 Click event
button?.addEventListener("click", handleUserLogin);

// ⌨️ Enter key support
[emailInput, passwordInput].forEach(input => {
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserLogin(e);
    }
  });
});
