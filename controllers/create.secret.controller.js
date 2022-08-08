const express = require('express')
const router = express.Router()
const k8s = require('@kubernetes/client-node')
const { envConstants, secretConstants } = require('../constants')

const timeHelpers = require('../helpers/time.helpers')
const stringHelpers = require('../helpers/string.helpers')
const responseHelpers = require('../helpers/response.helpers')
const { logger } = require('../helpers/logger.helpers')

router.post('/', async (req, res, next) => {
  try {
    const name = req.body.name.replace(/\s/g, '-')

    const secretData = { ...req.body.secret }
    Object.keys(secretData).forEach((key) => {
      secretData[key] = stringHelpers.to64(secretData[key])
    })
    var secretBody = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name,
        labels: {
          type: req.body.type.replace(/\s/g, '_'),
          icon: req.body.icon.replace(/\s/g, '_'),
          [secretConstants.selector]: secretConstants.label
        }
      },
      data: secretData
    }

    logger.debug(secretBody)

    const kc = new k8s.KubeConfig()
    kc.loadFromDefault()
    const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
    await k8sApi
      .readNamespacedSecret(name, envConstants.NAMESPACE)
      .then(async () => {
        next(new Error('A secret with this name already exists'))
      })
      .catch(async () => {
        const response = await k8sApi
          .createNamespacedSecret(envConstants.NAMESPACE, secretBody)
          .catch((error) => {
            logger.error(error)
          })

        res.status(200).json(responseHelpers.parse(response.body))
      })
  } catch (error) {
    next(error)
  }
})

module.exports = router
