// Helper functions shared by the login and register pages.

function $(selector, root = document) {
  return root.querySelector(selector);
}

// Show (or clear) an error message under an input.
// Returns true when there is no error.
function setError(input, message) {
  const field = input.closest(".field");
  field.classList.toggle("field--error", !!message);
  field.querySelector(".field__msg").textContent = message || "";
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return !message;
}

// Show (or hide) the red alert box at the top of a form.
function showAlert(element, message) {
  element.textContent = message;
  element.hidden = !message;
}

// Send JSON to the Express API.
async function post(path, body) {
  const response = await fetch(API_URL + path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Something went wrong. Please try again.");
  }
  return data;
}

// Show / Hide password buttons
document.querySelectorAll("[data-toggle]").forEach((button) => {
  button.addEventListener("click", () => {
    const input = document.getElementById(button.dataset.toggle);
    const showing = input.type === "text";
    input.type = showing ? "password" : "text";
    button.textContent = showing ? "Show" : "Hide";
  });
});