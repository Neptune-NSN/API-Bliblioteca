export const requireAuth = (req, res, next) => {
  console.log('Auth middleware executed');

  req.user = {
    id: 'fb3d8cfb-ab1a-4258-ba8b-62cb9eee10d9',
    name: 'Nicholas Francis Lambert',
    role: 'student'
  };

  next();
};
