import express from "express";
import { body } from "express-validator";
import { register, login } from "../controllers/auth.controller.js";

const router = express.Router();

router.post(
    '/register',
    [
        body('name').isString().isLength({ min: 2 }).withMessage('name é obrigatório'),
        body('password').isString().isLength({ min: 6 }).withMessage('password mínimo 6 caracteres'),
        body().custom((value) => {
            if (!value.email && !value.cardNumber) {
                throw new Error('informe email ou cardNumber');
            }
            return true;
        }),
    ],
    (req, res, next) => {
        return register(req, res, next);
    }
);

router.post(
    '/login',
    [
        body('identifier').isString().withMessage('identifier é obrigatório'),
        body('password').isString().withMessage('password é obrigatório'),
    ],
    (req, res, next) => login(req, res, next)
);

export default router;