// routes/sessions.js
import express from 'express';
import { getSessionById } from '../controllers/coursesListController.js';

const router = express.Router();

router.get('/:id', getSessionById);

export default router;