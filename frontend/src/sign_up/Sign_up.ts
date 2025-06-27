const sign_up_button = document.getElementById("sign_up") as HTMLButtonElement;
const loader = document.getElementById("loader") as HTMLDivElement;

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

  console.log("response gone");
  console.log(name);
  console.log(email);
  console.log(password);
  
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
      alert("Account created successfully!");
      window.location.href="/Login"
    }
  } catch (error) {
    console.error("Signup error:", error);
    alert("Something went wrong. Please try again later.");
  }
});
