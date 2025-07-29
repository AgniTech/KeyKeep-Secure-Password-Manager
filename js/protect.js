(function () {
  const token = localStorage.getItem('token');
  console.log("PROTECT.JS: Token is", token); // ✅ This will help debug

  if (!token || token === 'undefined' || token === 'null' || token.length < 10) {
    window.location.href = 'index.html';
  }
})();
