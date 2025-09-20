(function () {
  const token = localStorage.getItem('token');

  if (!token || token === 'undefined' || token === 'null' || token.length < 10) {
    window.location.href = 'index.html';
  }
})();
