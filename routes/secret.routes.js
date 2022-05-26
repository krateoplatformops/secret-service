const express = require('express')
const router = express.Router()

const createController = require('../controllers/create.secret.controller')
const readController = require('../controllers/read.secret.controller')
const deleteController = require('../controllers/delete.secret.controller')

router.use('/', createController)
router.use('/', readController)
router.use('/', deleteController)

module.exports = router
