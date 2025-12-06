import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { message: '' });
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.get("/user", (req, res) => {
  res.render("user");
});

router.get("/admin", (req, res) => {
  res.render("admin_home");
});

router.get("/admin/books", (req, res) => {
  res.render("admin_books");
});

router.get("/admin/loans", (req, res) => {
  res.render("admin_loans");
});

export default router;
