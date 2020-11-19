const express = require('express')
const controller = require('../controller/controller')

const router = express.Router();
router.get('/api/getAllData', controller.getUser);
router.post('/api/addNewData', controller.addUser);
router.put('/api/updateData', controller.updateUser);
router.delete('/api/deleteData', controller.deleteUser);

module.exports = router;
