let adminLoginButton = document.getElementById(
  "admin_sign_in"
) as HTMLButtonElement;

adminLoginButton?.addEventListener("click", async function (e) {
  e.preventDefault();

  const email = (
    document.getElementById("email") as HTMLInputElement
  )?.value.trim();
  const password = (document.getElementById("password") as HTMLInputElement)
    ?.value;

  if (!email || !password) {
    alert("Please fill in both email and password.");
    return;
  }

  try {
    await fetch("http://127.0.0.1:8000/api/auth/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json", // Important to get JSON back
      },
      body: JSON.stringify({ email, password }),
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Login success:", data);

        // Store the token in local storage
        localStorage.setItem("admin_token", data.token);
        window.location.href = "/admin/";
      })
      .catch((err) => {
        console.error("Network or server error:", err);
      });
  } catch (error) {
    console.error("Network or server error:", error);
    alert("Something went wrong. Please try again.");
  }
});
