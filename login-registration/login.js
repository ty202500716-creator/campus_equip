// ==========================================
// LOGIN PAGE SCRIPT
// ==========================================

const form = $("#login-form");

// Show success message if redirected from registration page (?registered=1)
if (new URLSearchParams(location.search).get("registered")) {
  $("#login-ok").hidden = false;
}

// Handle login form submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showAlert($("#login-error"), "");

  const identifier = $("#identifier");
  const password = $("#password");

  // Validate inputs
  const okId = setError(identifier, identifier.value.trim() ? "" : "Enter your school email or ID number.");
  const okPw = setError(password, password.value ? "" : "Enter your password.");
  if (!(okId && okPw)) return;

  const button = form.querySelector(".btn");
  button.disabled = true;
  button.textContent = "Logging in…";

  try {
    // Send login request to API
    const { token, user } = await post("/auth/login", {
      identifier: identifier.value.trim(),
      password: password.value,
    });

    // Save token and user info to storage
    const storage = $("#remember").checked ? localStorage : sessionStorage;
    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(user));

    // Redirect based on user role
    location.href = user.role === "admin" ? PAGES.admin : PAGES.dashboard;
  } catch (error) {
    showAlert($("#login-error"), error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Log in";
  }
});