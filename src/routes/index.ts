import express from 'express';

import * as pizzeria from './pizzeria';

const router = express.Router();

router.use('/order', pizzeria.router);

export = router;
