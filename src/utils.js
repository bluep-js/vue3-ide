export const jclone = obj => JSON.parse(JSON.stringify(obj))

export const waitFor = ms => new Promise(resolve => setTimeout(resolve, ms))
