const express = require('express')
const controller = require('../controller/controller')

const router = express.Router();
router.get('/api/getUsuario', controller.getUsuario);
router.post('/api/addUsuario', controller.addUsuario);
router.put('/api/updateUsuario', controller.updateUsuario);
router.delete('/api/deleteUsuario', controller.deleteUsuario);

router.get('/api/getVisitante', controller.getVisitante);
router.post('/api/addVisitante', controller.addVisitante);
router.put('/api/updateVisitante', controller.updateVisitante);
router.delete('/api/deleteVisitante', controller.deleteVisitante);

module.exports = router;
