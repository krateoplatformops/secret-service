const express = require('express')
const router = express.Router()
const k8s = require('@kubernetes/client-node')
const { secretConstants } = require('../constants')
const { envConstants } = require('../service-library/constants')

const stringHelpers = require('../service-library/helpers/string.helpers')
const responseHelpers = require('../helpers/response.helpers')
const logger = require('../helpers/logger.helpers')

router.post('/:group', async (req, res, next) => {
  try {
    const group = req.params.group
    const name = `${req.body.name.replace(/\s/g, '-')}-${group}`.toLowerCase()

    const secretData = { ...req.body.secret }

    if (req.body.target) {
      secretData.target = req.body.target
    }
    Object.keys(secretData).forEach((key) => {
      secretData[key] = stringHelpers.to64(secretData[key])
    })
    const secretBody = {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name,
        labels: {
          group,
          type: req.body.type.replace(/\s/g, '_'),
          icon: req.body.icon.replace(/\s/g, '_'),
          [secretConstants.selector]: secretConstants.label
        }
      },
      data: secretData
    }

    if (req.body.category) {
      secretBody.metadata.labels.category = req.body.category
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

        res.status(200).json(responseHelpers.parse(response.body, group))
      })
  } catch (error) {
    next(error)
  }
})

module.exports = router
