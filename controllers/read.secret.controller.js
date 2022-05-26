const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const uriHelpers = require('../helpers/uri.helpers')
const { envConstants } = require('../constants')
const Endpoint = mongoose.model('Endpoint')
const axios = require('axios')

router.get('/', async (req, res, next) => {
  try {
    Endpoint.find(req.query).exec((error, endpoints) => {
      if (error) {
        next(error)
      } else {
        res.status(200).json(endpoints)
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:prop/:value', async (req, res, next) => {
  try {
    Endpoint.findOne({ [req.params.prop]: req.params.value }).exec(
      async (error, endpoint) => {
        if (error) {
          next(error)
        } else {
          if (endpoint) {
            // Get secret values
            const secret = (
              await axios.get(
                uriHelpers.concatUrl([
                  envConstants.BRIDGE_URI,
                  'secrets',
                  endpoint.namespace,
                  endpoint.secretName
                ])
              )
            ).data

            res
              .status(200)
              .json({ ...endpoint.toObject(), secret: secret.data })
          } else {
            res.status(404).json({ message: 'Endpoint not found' })
          }
        }
      }
    )
  } catch (error) {
    next(error)
  }
})

module.exports = router
