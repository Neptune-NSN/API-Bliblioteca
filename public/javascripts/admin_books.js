const token = localStorage.getItem("token");

if (!token) {
  alert("Você precisa estar logado como administrador!");
  window.location.href = "/";
}

async function loadBooks() {
  const res = await fetch("/api/books/admin/books", {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const books = await res.json();
  const table = document.getElementById("booksTable");
  table.innerHTML = "";

  books.forEach(book => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${book.id}</td>
      <td>${book.title}</td>
      <td>${book.author}</td>
      <td>${book.isbn}</td>
      <td>${book.total_copies}</td>
      <td>${book.available_copies}</td>
      <td>
        <button class="edit-btn" data-id="${book.id}">Editar</button>
        <button class="delete-btn" data-id="${book.id}">Remover</button>
      </td>
    `;
    table.appendChild(row);
  });

  document.querySelectorAll(".delete-btn")
    .forEach(btn => btn.addEventListener("click", () => deleteBook(btn.dataset.id)));

  document.querySelectorAll(".edit-btn")
    .forEach(btn => btn.addEventListener("click", () => openEditBook(btn.dataset.id)));
}

async function deleteBook(id) {
  if (!confirm("Tem certeza que deseja remover este livro?")) return;

  const res = await fetch(`/api/books/admin/books/${id}`, {
    method: "DELETE",
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await res.json();
  alert(data.message);
  loadBooks();
}

async function openEditBook(id) {
  const row = [...document.querySelectorAll("tr")]
    .find(r => r.querySelector(`button[data-id="${id}"]`));

  const title = row.children[1].innerText;
  const author = row.children[2].innerText;
  const isbn = row.children[3].innerText;
  const total = row.children[4].innerText;
  const available = row.children[5].innerText;

  const newTitle = prompt("Novo título:", title);
  const newAuthor = prompt("Novo autor:", author);
  const newIsbn = prompt("Novo ISBN:", isbn);
  const newTotal = prompt("Total cópias:", total);
  const newAvailable = prompt("Disponíveis:", available);

  const res = await fetch(`/api/books/admin/books/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify({
      title: newTitle,
      author: newAuthor,
      isbn: newIsbn,
      total_copies: Number(newTotal),
      available_copies: Number(newAvailable)
    })
  });

  const data = await res.json();
  alert(data.message);
  loadBooks();
}

document.getElementById("createBookForm").addEventListener("submit", async e => {
  e.preventDefault();

  const form = e.target;
  const body = {
    title: form.title.value,
    author: form.author.value,
    isbn: form.isbn.value,
    total_copies: Number(form.total_copies.value)
  };

  const res = await fetch("/api/books/admin/books", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(body)
  });

  const data = await res.json();
  alert(data.message);
  form.reset();
  loadBooks();
});

// Inicializa
loadBooks();
