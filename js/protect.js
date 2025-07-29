// js/protect.js

// Redirect users who are not authenticated
const token = localStorage.getItem('token');

if (!token) {
  // Not logged in – send to login page
  window.location.href = "index.html";
}
