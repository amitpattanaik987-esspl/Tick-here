const adminLoginButton = document.getElementById("admin_sign_in") as HTMLButtonElement;

adminLoginButton?.addEventListener("click", async function (e) {
  e.preventDefault();

  const email = (document.getElementById("email") as HTMLInputElement)?.value.trim();
  const password = (document.getElementById("password") as HTMLInputElement)?.value;

  if (!email || !password) {
    alert("Please fill in both email and password.");
    return;
  }


  try {
    const res = await fetch("http://127.0.0.1:8000/api/auth/admin/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      // Validation or authentication error
      if (data.errors) {
        const messages = Object.values(data.errors).flat();
        alert(messages.join("\n"));
      } else if (data.message) {
        alert(data.message);
      } else {
        alert("Login failed. Please check your credentials.");
      }
      return;
    }

    // Success
    if (data.success && data.token) {
      localStorage.setItem("admin_token", data.token);
      alert("Login successful!");
      window.location.href = "/admin";
    } else {
      alert("Unexpected response from server.");
    }

  } catch (error) {
    console.error("Network or server error:", error);
    alert("A network error occurred. Please try again later.");
  }
});
