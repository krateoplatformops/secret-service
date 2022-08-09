const stringHelpers = require('./string.helpers')

const parse = (data, group, includeData = false) => {
  const payload = {
    metadata: {
      name: data.metadata.name,
      namespace: data.metadata.namespace,
      group: data.metadata.labels.group,
      uid: data.metadata.uid,
      icon: data.metadata.labels.icon.replace(/_/g, ' '),
      type: data.metadata.labels.type.replace(/_/g, ' '),
      category: data.metadata.labels.category
    },
    friendlyName: data.metadata.name
      .replace('-secret', '')
      .replace('-endpoint', '')
      .replace(/-/g, ' ')
  }

  if (group === 'endpoint') {
    payload.target = stringHelpers.b64toAscii(data.data.target)
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
