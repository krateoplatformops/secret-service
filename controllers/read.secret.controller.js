const express = require('express')
const router = express.Router()
const k8s = require('@kubernetes/client-node')
const request = require('request')
const { envConstants, secretConstants } = require('../constants')
const { logger } = require('../helpers/logger.helpers')
const yaml = require('js-yaml')
const responseHelpers = require('../helpers/response.helpers')

router.get('/', async (req, res, next) => {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const opts = {}
    kc.applyToRequest(opts)
    const s = await new Promise((resolve, reject) => {
      request(
        encodeURI(
          `${kc.getCurrentCluster().server}${secretConstants.api.formatUnicorn(
            envConstants
          )}?labelSelector=${secretConstants.selector}=${secretConstants.label}`
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

    res.status(200).json({
      list: payload.items.map((i) => {
        return responseHelpers.parse(i)
      })
    })
  } catch (error) {
    next(error)
  }
})

router.get('/:name', async (req, res, next) => {
  try {
    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const opts = {}
    kc.applyToRequest(opts)
    const s = await new Promise((resolve, reject) => {
      request(
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
      return res.status(404).json({ message: 'Secret not found' })
    }

    res.status(200).json(responseHelpers.parse(payload, true))
  } catch (error) {
    next(error)
  }
})

module.exports = router
