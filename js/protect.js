// js/protect.js

(function () {
  const token = localStorage.getItem('token');

  // If no token found, redirect to login page
  if (!token || token === 'undefined' || token === 'null') {
    console.warn("No valid token found. Redirecting to login...");
    window.location.href = 'index.html';
  }
})();
