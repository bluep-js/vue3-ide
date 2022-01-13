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
