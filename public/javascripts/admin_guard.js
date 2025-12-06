const role = localStorage.getItem("role");

if (role !== "admin") {
    alert("Acesso restrito ao administrador.");
    window.location.href = "/";
}
