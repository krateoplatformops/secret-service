module.exports = {
  api: '/api/v1/namespaces/{namespace}/secrets',
  selector: 'app.kubernetes.io/created-by',
  label: 'krateo'
}
