const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Secret = mongoose.model('Secret')
const axios = require('axios')
const uriHelpers = require('../helpers/uri.helpers')
const { envConstants } = require('../constants')

router.delete('/:id', async (req, res, next) => {
  try {
    Secret.findByIdAndDelete(req.params.id)
      .then(async (doc, err) => {
        if (err) {
          res.status(404).json({
            message: `Secret with id ${req.params.id} not found now`
          })
        } else {
          // Delete secret
          await axios.delete(
            uriHelpers.concatUrl([
              envConstants.BRIDGE_URI,
              'secrets',
              doc.namespace,
              doc.secretName
            ])
          )
          // response
          res
            .status(200)
            .json({ message: `Secret with id ${req.params.id} deleted` })
        }
      })
      .catch((err) => {
        res.status(500).json({
          message: err.message
        })
      })
  } catch (error) {
    next(error)
  }
})

module.exports = router
