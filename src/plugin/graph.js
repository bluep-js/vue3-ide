/**
 *  Tests if template accepts type.
 *  @param {Object} template - template object
 *  @param {string[]} [template.allow] - array of allow masks
 *  @param {string[]} [template.disallow] - array of disallow masks
 *  @param {string} [template.type] - current template type if defined
 *  @returns {boolean} accepts or not
 */
export const slotTemplateAcceptType = (template, type) => {
  if (typeof template.type === 'string') {
    // console.log('type defined! ??', template, type)
    return template.type === type
  }
  let ret = !!template.allow || !!template.disallow
  if (Array.isArray(template.allow)) {
    ret = ret && template.allow.some(tpl => {
      const rx = new RegExp(tpl.replaceAll('*', '.+'))
      return rx.test(type)
    })
  }
  if (Array.isArray(template.disallow)) {
    ret = ret && !template.disallow.some(tpl => {
      const rx = new RegExp(tpl.replaceAll('*', '.+'))
      return rx.test(type)
    })
  }
  return ret
}
