// ==========================================
// CONFIGURATION FILE
// ==========================================
// Change this to the address of your backend Express server.
const API_URL = "http://localhost:5000/api";

// Pages to open after successful login based on user role.
const PAGES = {
  dashboard: "dashboard.html", // For students and staff
  admin: "admin.html",         // For administrators
};