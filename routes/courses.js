// routes/courses.js
import express from 'express';
import { getCourses, getCourseById } from '../controllers/coursesListController.js';

const router = express.Router();

router.get('/', getCourses);
router.get('/:id', getCourseById);

export default router;