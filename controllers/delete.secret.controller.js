const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const Secret = mongoose.model('Secret')
const k8s = require('@kubernetes/client-node')

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
          const kc = new k8s.KubeConfig()
          kc.loadFromDefault()
          const k8sApi = kc.makeApiClient(k8s.CoreV1Api)
          await k8sApi.deleteNamespacedSecret(doc.name, doc.namespace)
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
