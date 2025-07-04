import {
  initLoader,
  showLoader,
  hideLoader,
} from "../components/loader/loader.js";

const sign_up_button = document.getElementById("sign_up") as HTMLButtonElement;

initLoader();

sign_up_button?.addEventListener("click", async function (e) {
  e.preventDefault();

  const name = (
    document.getElementById("name") as HTMLInputElement
  )?.value.trim();
  const email = (
    document.getElementById("email") as HTMLInputElement
  )?.value.trim();
  const password = (document.getElementById("password") as HTMLInputElement)
    ?.value;

  if (!name || !email || !password) {
    alert("Please fill in all fields.");
    return;
  }

  console.log("request");
  console.log(name);
  console.log(email);
  console.log(password);

  const validateEmail = (email: string) => {
    return String(email)
      .toLowerCase()
      .match(
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      );
  };

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
  }
  hideLoader();
});
