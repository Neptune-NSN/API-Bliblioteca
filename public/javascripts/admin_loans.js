const token = localStorage.getItem("token");

const btnPending = document.getElementById("btnPending");
const btnActive = document.getElementById("btnActive");

const pendingSection = document.getElementById("pendingSection");
const activeSection = document.getElementById("activeSection");

const pendingList = document.getElementById("pendingList");
const activeList = document.getElementById("activeList");

btnPending.addEventListener("click", () => {
    pendingSection.style.display = "block";
    activeSection.style.display = "none";
    activateTab(btnPending);
    loadPending();
});

btnActive.addEventListener("click", () => {
    pendingSection.style.display = "none";
    activeSection.style.display = "block";
    activateTab(btnActive);
    loadActive();
});

function activateTab(button) {
    btnPending.style.backgroundColor = "#007bff";
    btnActive.style.backgroundColor = "#007bff";
    button.style.backgroundColor = "#0056b3";
}

async function loadPending() {
    pendingList.innerHTML = "<li>Carregando...</li>";

    const res = await fetch("/api/loans/admin/pending", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    const pendings = data.pending || [];

    pendingList.innerHTML = "";

    if (pendings.length === 0) {
        pendingList.innerHTML = "<li>Nenhum empréstimo pendente.</li>";
        return;
    }

    pendings.forEach(loan => {
        const li = document.createElement("li");
        li.style.marginBottom = "15px";
        li.style.padding = "10px";
        li.style.border = "1px solid #ccc";
        li.style.borderRadius = "6px";

        li.innerHTML = `
            <strong>${loan.userName}</strong> (${loan.userEmail})<br>
            Livro: <strong>${loan.bookTitle}</strong><br>
            Solicitado em: ${new Date(loan.borrowedAt).toLocaleDateString()}<br><br>
            <button class="approve-btn" data-id="${loan.id}">Aprovar</button>
            <button class="reject-btn" data-id="${loan.id}">Rejeitar</button>
        `;

        pendingList.appendChild(li);
    });

    document.querySelectorAll(".approve-btn").forEach(btn =>
        btn.addEventListener("click", () => approveLoan(btn.dataset.id))
    );

    document.querySelectorAll(".reject-btn").forEach(btn =>
        btn.addEventListener("click", () => rejectLoan(btn.dataset.id))
    );
}

async function loadActive() {
    activeList.innerHTML = "<li>Carregando...</li>";

    const res = await fetch("/api/loans/admin/all", {
        headers: { "Authorization": `Bearer ${token}` }
    });

    const data = await res.json();
    const loans = data.loans || [];

    const actives = loans.filter(l => l.status === "active");
    actives.sort((a, b) => new Date(a.dueAt) - new Date(b.dueAt));

    activeList.innerHTML = "";

    if (actives.length === 0) {
        activeList.innerHTML = "<li>Nenhum empréstimo ativo.</li>";
        return;
    }

    actives.forEach(loan => {
        const due = new Date(loan.dueAt);
        const li = document.createElement("li");

        li.style.marginBottom = "15px";
        li.style.padding = "10px";
        li.style.border = "1px solid #ccc";
        li.style.borderRadius = "6px";
        if (due < new Date()) li.style.background = "#ffb3b3";

        li.innerHTML = `
            <strong>${loan.userName}</strong> (${loan.userEmail})<br>
            Livro: <strong>${loan.bookTitle}</strong><br>
            Deve devolver até: ${due.toLocaleDateString()}<br><br>
            <button class="return-btn" data-id="${loan.id}">Marcar como Devolvido</button>
        `;

        activeList.appendChild(li);
    });

    document.querySelectorAll(".return-btn").forEach(btn =>
        btn.addEventListener("click", () => returnLoan(btn.dataset.id))
    );
}

async function approveLoan(id) {
    const res = await fetch(`/api/loans/admin/${id}/approve`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    alert((await res.json()).message);
    loadPending();
}

async function rejectLoan(id) {
    const res = await fetch(`/api/loans/admin/${id}/reject`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    alert((await res.json()).message);
    loadPending();
}

async function returnLoan(id) {
    const res = await fetch(`/api/loans/admin/${id}/return`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
    });

    alert((await res.json()).message);
    loadActive();
}

activateTab(btnPending);
pendingSection.style.display = "block";
loadPending();
