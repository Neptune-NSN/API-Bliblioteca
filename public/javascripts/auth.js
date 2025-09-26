const API_URL = "http://localhost:3000/api/auth";

// Login
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async e => {
        e.preventDefault();
        const identifier = document.getElementById('identifier').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('errorLogin');

        try {
            const res = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem('token', data.token);
                alert("Login realizado com sucesso!");
            } else {
                errorEl.textContent = data.error || "Erro no login";
            }
        } catch (err) {
            errorEl.textContent = "Erro ao conectar com o servidor";
        }
    });
}

// Cadastro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async e => {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const cardNumber = document.getElementById('card_number').value;
        const password = document.getElementById('password').value;
        const errorEl = document.getElementById('errorRegister');

        try {
            const res = await fetch(`${API_URL}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, cardNumber, password })
            });
            const data = await res.json();

            if (res.ok) {
                alert("Cadastro realizado! Faça login.");
                window.location.href = "/";
            } else {
                errorEl.textContent = data.error || "Erro no cadastro";
            }
        } catch (err) {
            errorEl.textContent = "Erro ao conectar com o servidor";
        }
    });
}
