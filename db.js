var flatCache = require('flat-cache')
var path = require('path')
let cache

const init = () => {
  cache = flatCache.load('db', path.resolve(__dirname))
}
const get = (id) => {
  const data = cache.getKey(id) // { foo: 'var' }
  if (!data) return []
  return data
}

const set = (id, data) => {
  cache.setKey(id, data)
  cache.save()
  return
}

module.exports = { get, set, init }
