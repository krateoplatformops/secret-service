const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const { envConstants } = require('../constants')
const axios = require('axios')

const Endpoint = mongoose.model('Endpoint')
const timeHelpers = require('../helpers/time.helpers')
const uriHelpers = require('../helpers/uri.helpers')

router.post('/', async (req, res, next) => {
  try {
    const parsed = uriHelpers.parse(req.body.target)
    const secretName = `${req.body.name}-secret`

    Endpoint.countDocuments({ secretName }, (err, count) => {
      if (count > 0) {
        next(new Error(`Secret with name ${secretName} already exists`))
      }
    })

    const dbValues = ['name', 'target', 'type', 'icon', 'category']

    const secret = Object.keys(req.body)
      .filter((key) => !dbValues.includes(key))
      .map((key) => ({ key, val: req.body[key] }))

    const payload = {
      secretName,
      createdAt: timeHelpers.currentTime(),
      domain: parsed.domain,
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
        secretName
      ]),
      { data: secret }
    )

    if (saved.status === 200) {
      Endpoint.create(payload)
        .then((endpoint) => {
          res.status(200).json(endpoint)
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
