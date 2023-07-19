import express from 'express';
import * as controllers from '../controllers';

export const router = express.Router();
router.get('/:id', controllers.pizzeria.get);
router.post('/', controllers.pizzeria.add);

