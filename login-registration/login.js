const form = $("#login-form");

// Message after a successful registration (register.js redirects with ?registered=1)
if (new URLSearchParams(location.search).get("registered")) {
  $("#login-ok").hidden = false;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showAlert($("#login-error"), "");

  const identifier = $("#identifier");
  const password = $("#password");

  const okId = setError(identifier, identifier.value.trim() ? "" : "Enter your school email or ID number.");
  const okPw = setError(password, password.value ? "" : "Enter your password.");
  if (!(okId && okPw)) return;

  const button = form.querySelector(".btn");
  button.disabled = true;
  button.textContent = "Logging in…";

  try {
    // Expected response: { token, user: { id, fullName, email, role } }
    const { token, user } = await post("/auth/login", {
      identifier: identifier.value.trim(),
      password: password.value,
    });

    const storage = $("#remember").checked ? localStorage : sessionStorage;
    storage.setItem("token", token);
    storage.setItem("user", JSON.stringify(user));

    location.href = user.role === "admin" ? PAGES.admin : PAGES.dashboard;
  } catch (error) {
    showAlert($("#login-error"), error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Log in";
  }
});