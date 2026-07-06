const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/recipes.controller');
const { authenticate } = require('../middleware/auth.middleware');

router.use(authenticate);

router.get('/dishes',             ctrl.listDishes);
router.post('/dishes',            ctrl.createDish);
router.put('/dishes/:id',         ctrl.updateDish);
router.delete('/dishes/:id',      ctrl.deleteDish);
router.get('/dishes/:id/recipe',  ctrl.getRecipe);
router.put('/dishes/:id/recipe',  ctrl.setRecipe);

module.exports = router;