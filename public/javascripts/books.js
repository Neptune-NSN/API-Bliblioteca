async function fetchAvailableBooks() {
  const token = localStorage.getItem('token');
  const booksListEl = document.getElementById('booksList');
  const bookSelectEl = document.getElementById('bookSelect');

  if (!token) {
    booksListEl.innerHTML = '<li>Faça login para ver os livros disponíveis.</li>';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/books/available', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Erro ao buscar livros: ${res.status}`);

    const books = await res.json();

    if (books.length === 0) {
      booksListEl.innerHTML = '<li>Nenhum livro disponível no momento.</li>';
      bookSelectEl.innerHTML = '<option value="">-- Nenhum livro --</option>';
      return;
    }

    booksListEl.innerHTML = books.map(b =>
      `<li>${b.title} - ${b.author} (${b.available_copies} disponíveis)</li>`
    ).join('');

    bookSelectEl.innerHTML = '<option value="">-- selecione um livro --</option>';
    books.forEach(b => {
      const option = document.createElement('option');
      option.value = b.id;
      option.textContent = b.title;
      bookSelectEl.appendChild(option);
    });

  } catch (err) {
    console.error(err);
    booksListEl.innerHTML = `<li>Erro ao carregar livros: ${err.message}</li>`;
  }
}

async function requestLoan() {
  const bookId = document.getElementById('bookSelect').value;
  if (!bookId) return alert('Selecione um livro para solicitar.');

  const token = localStorage.getItem('token');
  try {
    const res = await fetch('http://localhost:3000/api/loans/request', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ bookId })
    });

    const data = await res.json();
    if (res.ok) {
      alert('Empréstimo solicitado com sucesso!');
      fetchAvailableBooks();
    } else {
      alert(data.error || 'Erro ao solicitar empréstimo');
    }
  } catch (err) {
    alert('Erro ao conectar com o servidor');
    console.error(err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchAvailableBooks();
  document.getElementById('borrowBtn').addEventListener('click', requestLoan);
});
