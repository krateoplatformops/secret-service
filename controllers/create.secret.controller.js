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

    const dbValues = ['name', 'icon', 'type']

    const secret = Object.keys(req.body)
      .filter((key) => !dbValues.includes(key))
      .map((key) => ({ key, val: req.body[key] }))

    const payload = {
      name,
      createdAt: timeHelpers.currentTime(),
      namespace: envConstants.NAMESPACE,
      ...Object.keys(req.body)
        .filter((key) => dbValues.includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: req.body[key] }), {})
    }

    const saved = await axios.post(
      uriHelpers.concatUrl([
        envConstants.BRIDGE_URI,
        'secrets',
        envConstants.NAMESPACE,
        name
      ]),
      { data: secret }
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
