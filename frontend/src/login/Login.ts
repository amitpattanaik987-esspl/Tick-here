const button = document.getElementById("sign_in") as HTMLButtonElement;

button?.addEventListener("click", async function (e) {
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
      return;
    }

    const result = await response.json();
    console.log("Login success:", result);
    console.log(result.token);
    
    // Example: redirect or store token
    localStorage.setItem('auth-token', result.token);
    localStorage.setItem('User_details', JSON.stringify(result.data));
    window.location.href = '/';
    
  } catch (error) {
    console.error("Network or server error:", error);
    alert("Something went wrong. Please try again.");
  }
});
