const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { envConstants } = require('../constants')
const axios = require('axios')

const Secret = mongoose.model('Secret')
const timeHelpers = require('../helpers/time.helpers')
const uriHelpers = require('../helpers/uri.helpers')

router.post('/', async (req, res, next) => {
  try {
    const name = req.body.name

    Secret.countDocuments({ name }, (err, count) => {
      if (count > 0) {
        next(new Error(`Secret with name ${name} already exists`))
      }
    })

    const payload = {
      createdAt: timeHelpers.currentTime(),
      namespace: envConstants.NAMESPACE,
      name: req.body.name,
      icon: req.body.icon,
      type: req.body.type
    }

    const saved = await axios.post(
      uriHelpers.concatUrl([
        envConstants.BRIDGE_URI,
        'secrets',
        envConstants.NAMESPACE,
        name
      ]),
      { data: req.body.secret }
    )

    if (saved.status === 200) {
      Secret.create(payload)
        .then((secret) => {
          res.status(200).json(secret)
        })
        .catch((error) => {
          next(error)
        })
    } else {
      next(new Error('Failed to create secret'))
    }
  } catch (error) {
    next(error)
  }
})

module.exports = router
