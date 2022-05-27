const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const uriHelpers = require('../helpers/uri.helpers')
const { envConstants } = require('../constants')
const Secret = mongoose.model('Secret')
const axios = require('axios')

router.get('/', async (req, res, next) => {
  try {
    Secret.find(req.query).exec((error, secrets) => {
      if (error) {
        next(error)
      } else {
        res.status(200).json(secrets)
      }
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:prop/:value', async (req, res, next) => {
  try {
    Secret.findOne({ [req.params.prop]: req.params.value }).exec(
      async (error, secret) => {
        if (error) {
          next(error)
        } else {
          if (secret) {
            // Get secret values
            const secretData = (
              await axios.get(
                uriHelpers.concatUrl([
                  envConstants.BRIDGE_URI,
                  'secrets',
                  secret.namespace,
                  secret.name
                ])
              )
            ).data

            res
              .status(200)
              .json({ ...secret.toObject(), data: secretData.data })
          } else {
            res.status(404).json({ message: 'Secret not found' })
          }
        }
      }
    )
  } catch (error) {
    next(error)
  }
})

module.exports = router
