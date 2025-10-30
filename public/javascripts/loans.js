async function fetchMyLoans() {
  const token = localStorage.getItem('token');
  const loansListEl = document.getElementById('myLoansList');

  if (!token) {
    loansListEl.innerHTML = '<li>Faça login para ver seus empréstimos.</li>';
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/loans/me', {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) {
      throw new Error(`Erro ao buscar empréstimos: ${res.status}`);
    }

    const data = await res.json();
    const loans = data.loans;

    if (loans.length === 0) {
      loansListEl.innerHTML = '<li>Você não tem empréstimos ativos.</li>';
      return;
    }

    // Populate list with renew buttons
    loansListEl.innerHTML = loans.map(l =>
      `<li>
        ${l.title} - Retirado em: ${new Date(l.borrowedAt).toLocaleDateString()} 
        | Devolver até: ${new Date(l.dueAt).toLocaleDateString()}
        | Renovações: ${l.renewedCount}/${l.maxRenewals}
        <button data-loan-id="${l.id}" class="renew-btn">Renovar</button>
      </li>`
    ).join('');

    // Add click handlers to renew buttons
    document.querySelectorAll('.renew-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const loanId = btn.dataset.loanId;
        await renewLoan(loanId);
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
    const res = await fetch(`http://localhost:3000/api/loans/renew/${loanId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    const data = await res.json();

    if (res.ok) {
      alert(`Empréstimo renovado! Nova data de devolução: ${new Date(data.loan.dueAt).toLocaleDateString()}`);
      fetchMyLoans(); // Refresh the list
    } else {
      alert(data.error || 'Erro ao renovar empréstimo.');
    }
  } catch (err) {
    console.error(err);
    alert('Erro ao conectar com o servidor.');
  }
}

document.addEventListener('DOMContentLoaded', fetchMyLoans);
