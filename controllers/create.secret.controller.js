const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const k8s = require('@kubernetes/client-node')
const { envConstants } = require('../constants')

const Secret = mongoose.model('Secret')
const timeHelpers = require('../helpers/time.helpers')
const stringHelpers = require('../helpers/string.helpers')

router.post('/', async (req, res, next) => {
  try {
    const name = req.body.name.replace(/\s/g, '-')

    Secret.countDocuments({ name }, (err, count) => {
      if (count > 0) {
        next(new Error(`Secret with name ${name} already exists`))
      }
    })

    const payload = {
      createdAt: timeHelpers.currentTime(),
      namespace: envConstants.NAMESPACE,
      name,
      icon: req.body.icon,
      type: req.body.type
    }

    const secretData = { ...req.body.secret }
    Object.keys(secretData).forEach((key) => {
      secretData[key] = stringHelpers.to64(secretData[key])
    })

    var secretBody = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name
      },
      data: secretData
    }

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()

    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)

    await k8sApi
      .readNamespacedSecret(name, envConstants.NAMESPACE)
      .then(async () => {
        next(new Error('A secret with this name already exists'))
      })
      .catch(async () => {
        await k8sApi.createNamespacedSecret(envConstants.NAMESPACE, secretBody)
        Secret.create(payload)
          .then((secret) => {
            res.status(200).json(secret)
          })
          .catch((error) => {
            next(error)
          })
      })
  } catch (error) {
    next(error)
  }
})

module.exports = router
