let selectedBookId = null;

async function fetchMyLoans() {
  const token = localStorage.getItem('token');
  const loansListEl = document.getElementById('myLoansList');

  if (!token) {
    loansListEl.innerHTML = '<li>Faça login para ver seus empréstimos.</li>';
    return;
  }

  try {
    const res = await fetch('/api/loans/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error(`Erro ao buscar empréstimos: ${res.status}`);

    const data = await res.json();
    const loans = data.loans;

    if (!loans || loans.length === 0) {
      loansListEl.innerHTML = '<li>Você não tem empréstimos ativos.</li>';
      return;
    }

    loansListEl.innerHTML = "";

    loans.forEach(loan => {
      const li = document.createElement("li");

      const due = new Date(loan.dueAt);
      const isLate = due < new Date();

      li.className = "loan-card" + (isLate ? " late" : "");

      li.innerHTML = `
        <div class="loan-content">
          <strong>${loan.title}</strong><br>
          Devolver até: ${due.toLocaleDateString()}<br>
        </div>

        <div class="renew-info">
          Renovações: ${loan.renewedCount}/${loan.maxRenewals}
        </div>

        <button class="renew-btn" data-loan-id="${loan.id}">
          Renovar
        </button>
      `;

      loansListEl.appendChild(li);
    });

    document.querySelectorAll('.renew-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        renewLoan(btn.dataset.loanId);
      });
    });

  } catch (err) {
    console.error(err);
    loansListEl.innerHTML = `<li>Erro ao carregar empréstimos: ${err.message}</li>`;
  }
}

async function renewLoan(loanId) {
  const token = localStorage.getItem('token');
  if (!token) return alert('Faça login para renovar empréstimos.');

  try {
    const res = await fetch(`/api/loans/renew/${loanId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Empréstimo renovado! Nova data: ${new Date(data.loan.dueAt).toLocaleDateString()}`);
      fetchMyLoans();

    } else {
      alert(data.error || 'Erro ao renovar empréstimo.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao conectar com o servidor.');
  }
}

async function fetchAvailableBooks() {
  const token = localStorage.getItem("token");
  const booksList = document.getElementById("booksList");

  const res = await fetch("/api/books/available", {
    headers: { "Authorization": `Bearer ${token}` }
  });

  const data = await res.json();
  const books = data.books || data; 


  booksList.innerHTML = "";

  books.forEach(book => {
    const li = document.createElement("li");
    li.className = "book-card";

    li.innerHTML = `
      <input type="radio" name="bookSelect" value="${book.id}">
      <strong>${book.title}</strong> — ${book.author}
    `;

    booksList.appendChild(li);
  });

  document.querySelectorAll('input[name="bookSelect"]').forEach(radio => {
    radio.addEventListener("change", () => {
      selectedBookId = radio.value;
    });
  });
}

async function borrowBook(bookId) {
  const token = localStorage.getItem("token");

  const res = await fetch("/api/loans/request", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ bookId })
  });

  const data = await res.json();

  if (res.ok) {
    alert("Empréstimo solicitado com sucesso!");
    cancelBooksPage();
    fetchMyLoans();
  } else {
    alert(data.error || "Erro ao solicitar empréstimo.");
  }
}

document.addEventListener('DOMContentLoaded', () => {
  fetchMyLoans();
  fetchAvailableBooks(); 
});
