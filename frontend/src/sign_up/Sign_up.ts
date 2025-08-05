import {
  initLoader,
  showLoader,
  hideLoader,
} from "../components/loader/loader.js";

initLoader();

const sign_up_button = document.getElementById("sign_up") as HTMLButtonElement;
const nameInput = document.getElementById("name") as HTMLInputElement;
const emailInput = document.getElementById("email") as HTMLInputElement;
const passwordInput = document.getElementById("password") as HTMLInputElement;

const validateEmail = (email: string) => {
  return String(email)
    .toLowerCase()
    .match(
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
};

async function handleUserSignup(e?: Event) {
  e?.preventDefault();

  const name = nameInput?.value.trim();
  const email = emailInput?.value.trim();
  const password = passwordInput?.value;

  if (!name || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  if (!validateEmail(email)) {
    alert("Not a valid Email");
    return;
  }

  if (password.length < 8) {
    alert("Minimum 8 digit password required");
    return;
  }

  showLoader();
  try {
    const response = await fetch("http://127.0.0.1:8000/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password }),
    });

    const result = await response.json();
    console.log(result);

    if (!response.ok) {
      alert(`Signup failed: ${result.message || "Unknown error"}`);
    } else {
      alert(
        "Account created successfully! \nKindly check your mail for verification link!"
      );
    }
  } catch (error) {
    console.error("Signup error:", error);
    alert("Something went wrong. Please try again later.");
  } finally {
    hideLoader();
  }
}

sign_up_button?.addEventListener("click", handleUserSignup);

[nameInput, emailInput, passwordInput].forEach((input) => {
  input?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      handleUserSignup(e);
    }
  });
});
