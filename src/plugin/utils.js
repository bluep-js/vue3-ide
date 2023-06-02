import { toRaw } from 'vue'
/**
 *  Cloning function used everywhere
 *  @param {T} obj - object to clone. by current implementation - should be "JSON compaible"
 *  @returns {T} cloned version of ``obj``
 */
export const jclone = obj => JSON.parse(JSON.stringify(obj))

/**
 *  Promisified version of ``setTimeout`` to use with async/await
 *  @param {number} ms - timeout in milliseconds
 *  @returns {Promise} timeout promise
 */
export const waitFor = ms => new Promise(resolve => setTimeout(resolve, ms))

/**
 *  Returns object deep element by string path
 *  @param {Object} obj - source object
 *  @param {string} path - path
 *  @param {string} [splitter='/'] - path splitter
 *  @returns {any} path element
 *  @throws error if path is not reachable with full ``path`` and ``p`` not existing element
 */
export const getByPath = (obj, path, splitter = '/') => {
  const paths = path.split(splitter)
  let ptr = obj
  paths.forEach(p => {
    if (ptr) ptr = ptr[p]
    else throw Error('path not reachable', { path, p })
  })
  return ptr
}

/**
 *  isEqual utility
 */
const _isEqualArrays = (a, b) => {
  const aia = Array.isArray(a)
  const bia = Array.isArray(b)
  if (aia !== bia) return false
  if (!aia || !bia) return false
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    if (!isEqual(a[i], b[i])) return false
  }
  return true
}

const _isEqualObjects = (a, b) => {
  if (!a || !b) {
    return (!!a || !!b) ? false : a === b
  }
  const aks = Object.keys(a || {})
  const bks = Object.keys(b || {})
  if (aks.length !== bks.length) return false
  for (let i = 0; i < aks.length; i++) {
    const k = aks[i]
    if (!bks.includes(k)) return false
    if (!isEqual(a[k], b[k])) return false
  }
  return true
}

/**
 *  Deep comparing of 2 variables
 *  @param {any} a - 1st value to compare
 *  @param {any} b - 2nd value to compare
 *  @returns {boolean} values are equal or not
 */
export const isEqual = (objA, objB) => {
  try {
    const a = toRaw(objA)
    const b = toRaw(objB)
    if (typeof a !== typeof b) return false
    if (!a && !b) return a === b

    const aia = Array.isArray(a)
    const bia = Array.isArray(b)
    if (aia || bia) return _isEqualArrays(a, b)

    const aio = typeof a === 'object'
    const bio = typeof b === 'object'
    if (aio || bio) return _isEqualObjects(a, b)

    return a === b
  } catch (err) {
    console.log('isEqual error', err)
    return false
  }
}
