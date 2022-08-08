const express = require('express')
const router = express.Router()
const k8s = require('@kubernetes/client-node')
const request = require('request')
const yaml = require('js-yaml')
const { logger } = require('../helpers/logger.helpers')
const { envConstants, secretConstants } = require('../constants')

router.delete('/:name', async (req, res, next) => {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const opts = {}
    kc.applyToRequest(opts)
    const s = await new Promise((resolve, reject) => {
      request.delete(
        encodeURI(
          `${kc.getCurrentCluster().server}${secretConstants.api.formatUnicorn(
            envConstants
          )}/${req.params.name}`
        ),
        opts,
        (error, response, data) => {
          logger.debug(JSON.stringify(response))
          if (error) {
            logger.error(error)
            reject(error)
          } else resolve(data)
        }
      )
    })

    const payload = yaml.load(s)

    if (payload.code === 404) {
      return res
        .status(404)
        .json({ message: `Secret ${req.params.name} not found` })
    }

    res.status(200).json({ message: `Secret ${req.params.name} deleted` })
  } catch (error) {
    next(error)
  }
})

module.exports = router
