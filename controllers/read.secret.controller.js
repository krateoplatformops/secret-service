const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Secret = mongoose.model('Secret')
const k8s = require('@kubernetes/client-node')
const stringHelpers = require('../helpers/string.helpers')

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
            const kc = new k8s.KubeConfig()
            kc.loadFromDefault()

            const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
            const data = (
              await k8sApi.readNamespacedSecret(secret.name, secret.namespace)
            ).body.data

            const secretData = []
            Object.keys(data).forEach((key) => {
              secretData.push({
                key: key,
                val: stringHelpers.b64toAscii(data[key])
              })
            })

            res.status(200).json({ ...secret.toObject(), data: secretData })
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
