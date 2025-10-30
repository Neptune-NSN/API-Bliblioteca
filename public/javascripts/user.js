function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = "/";
}

document.addEventListener('DOMContentLoaded', () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (!user) {
    window.location.href = '/';
    return;
  }

  document.querySelector('.user-container h2').textContent =
    `Bem-vindo(a), ${user.name || 'usuário'}!`;
});