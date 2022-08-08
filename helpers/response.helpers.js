const stringHelpers = require('./string.helpers')

const parse = (data, includeData = false) => {
  const payload = {
    metadata: {
      name: data.metadata.name,
      namespace: data.metadata.namespace,
      uid: data.metadata.uid,
      icon: data.metadata.labels.icon.replace(/_/g, ' '),
      type: data.metadata.labels.type
    }
  }

  if (includeData) {
    payload.data = Object.keys(data.data).map((key) => {
      return {
        key,
        val: stringHelpers.b64toAscii(data.data[key])
      }
    })
  }

  return payload
}

module.exports = {
  parse
}
