const mongoose = require('mongoose')
const Schema = mongoose.Schema

const { dbConstants } = require('../constants')

const endpointSchema = new Schema({
  namespace: {
    type: String,
    required: true
  },
  secretName: {
    type: String,
    required: true
  },
  icon: {
    type: String,
    required: true
  },
  createdAt: {
    type: Number,
    required: true
  }
})

module.exports = mongoose.model(
  'Endpoint',
  endpointSchema,
  dbConstants.COLLECTION_ENDPOINT
)
