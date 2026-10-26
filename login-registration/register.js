// ==========================================
// REGISTRATION PAGE SCRIPT
// ==========================================

const form = $("#register-form");

// Dynamically update labels and red active state when switching between Student / Staff
form.querySelectorAll('input[name="role"]').forEach((radio) => {
  radio.addEventListener("change", () => {
    const staff = form.role.value === "staff";
    
    // Update labels based on role
    $("#id-label").textContent = staff ? "Employee ID" : "Student ID";
    $("#dept-label").textContent = staff ? "Office or department" : "College";
    
    // Toggle active red styling class (.is-on) on the selected option box
    form.querySelectorAll(".seg__opt").forEach((label) => {
      label.classList.toggle("is-on", label.querySelector("input").checked);
    });
  });
});

// Password strength validator
function passwordMessage(value) {
  if (value.length < 8) return "Use at least 8 characters.";
  if (!/\d/.test(value) || !/[A-Za-z]/.test(value)) return "Include both letters and numbers.";
  return "";
}

// Handle registration form submission
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  showAlert($("#register-error"), "");

  const staff = form.role.value === "staff";

  // Validate all fields
  const results = [
    setError(form.fullName, form.fullName.value.trim() ? "" : "Enter your full name."),
    setError(form.idNumber, form.idNumber.value.trim() ? "" : `Enter your ${staff ? "employee" : "student"} ID number.`),
    setError(form.department, form.department.value.trim() ? "" : `Enter your ${staff ? "office" : "college"}.`),
    setError(form.email, /^\S+@\S+\.\S+$/.test(form.email.value.trim()) ? "" : "Enter a valid email address."),
    setError(form.password, passwordMessage(form.password.value)),
    setError(form.confirm, form.confirm.value === form.password.value ? "" : "Passwords do not match."),
  ];
  if (results.includes(false)) return;

  const button = form.querySelector(".btn");
  button.disabled = true;
  button.textContent = "Creating account…";

  try {
    // Send registration request to API
    await post("/auth/register", {
      role: form.role.value, // "student" or "staff"
      fullName: form.fullName.value.trim(),
      idNumber: form.idNumber.value.trim(),
      department: form.department.value.trim(),
      email: form.email.value.trim(),
      password: form.password.value,
    });
    // Redirect to login page with success flag
    location.href = "index.html?registered=1";
  } catch (error) {
    showAlert($("#register-error"), error.message);
  } finally {
    button.disabled = false;
    button.textContent = "Create account";
  }
});