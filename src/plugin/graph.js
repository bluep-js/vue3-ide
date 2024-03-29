import { jclone } from './utils.js'

/**
 *  Generates function structure for library
 *  @param {Object} info - information for function
 *  @param {string} info.code - function code (machine readable)
 *  @param {string} info.name - function name (user readable)
 *  @param {string} info.library - function library owner
 *  @param {string} [info.type='function'] - type of graph. should be ``'function'``
 *  @returns {Object} function structure
 */
export const newFunction = ({ code, name, library, type = 'function' }, nodes) => {
  const data = {
    code,
    name,
    library,
    type,
    entry: '',
    context: {
      inputs: {},
      outputs: {},
      variables: {}
    },
    graph: {
      nodes: {},
      edges: {}
    },
    layout: {
      parts: {},
      field: {
        top: -1000,
        left: -1000,
        width: 4000,
        height: 3000
      },
      zoom: {
        min: 0.4,
        max: 5,
        step: 0.3,
        current: 1
      }
    }
  }
  const graphCall = nodes.find(n => n.code === 'graph/call')
  if (!graphCall) {
    // eslint-disable-next-line
    console.error('no nodes! Check Editor :nodes props connection, please :)')
    return
  }
  const callNode = jclone(graphCall)
  const now = new Date()
  callNode.id = `${callNode.code}_${now.getTime()}`
  data.graph.nodes[callNode.id] = callNode
  data.layout.parts[callNode.id] = {
    x: 1010,
    y: 1010
  }
  data.entry = callNode.id
  return data
}

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
    console.log('type defined! ??', template, type)
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

/**
 *  Tests if slot accept other slot only by checking arrays existance and properties
 *  @param {Object} slot - incoming slot ("other slot")
 *  @param {Object} tslot - slot to test
 *  @returns {boolean} test result
 */
export const slotAcceptSlotArray = (slot, oslot) => {
  if (!slot.isArray) {
    return slot.canBeArray
      ? true
      : !oslot.isArray
  }
  const sa = (slot.isArray === true)
    ? 1
    : typeof slot.isArray === 'number'
      ? slot.isArray
      : 0
  const oa = (oslot.isArray === true)
    ? 1
    : typeof oslot.isArray === 'number'
      ? oslot.isArray
      : 0
  if (!oa && oslot.canBeArray) return true
  if (!oa && sa) return false
  return oa <= sa
}

/**
 *  Tests if templated slot accept other slot
 *  @param {Object} slot - incoming slot ("other slot")
 *  @param {Object} tslot - templated slot to test
 *  @param {Object} template - template data
 *  @returns {boolean} test result
 */
export const slotTemplateAcceptSlot = (slot, tslot, template) => {
  if (!slotTemplateAcceptType(template, slot.type)) return false
  return slotAcceptSlotArray(slot, tslot)
}

/**
 *  Check and extract keys for slot template and variant (if required)
 *  @param {Object} node - node owning slot and templates
 *  @param {Object} slot - templated slot
 *  @returns {{tkey: string | null, vkey: string | null}} object with template and variant keys
 */
export const slotTemplateKeys = (node, slot) => {
  const ret = {
    tkey: null,
    vkey: null
  }
  if (slot.type !== 'basic/template') return ret
  if (!node.templates) return ret
  if (node.templates[slot.template]) {
    ret.tkey = slot.template
    return ret
  }
  if (typeof slot.template !== 'string') return ret
  if (!slot.template.includes('/')) return ret
  let vkey = null
  const tpl = Object.keys(node.templates).find(tkey => {
    const tpld = node.templates[tkey]
    const vvkey = Object.keys(tpld.variants || {}).find(vky => slot.template === `${tkey}/${vky}`)
    if (vvkey) vkey = vvkey
    return !!vvkey
  })
  if (!tpl || !vkey) return ret
  ret.tkey = tpl
  ret.vkey = vkey
  return ret
}

/**
 *  List of available classes for some library
 *  @param {Object} libraries - full libraries object
 *  @param {string} library - selected library
 *  @param {Object} modules - VM modules metadata map by module code
 *  @returns {Object} classes map by class code
 */
export const availableClasses = (libraries, library, modules) => {
  let ret = {}
  Object.values(modules).forEach(m => {
    const jm = jclone(m.classes || {})
    Object.keys(jm).forEach(code => {
      jm[code].module = m.code
    })
    ret = { ...ret, ...jm }
  })
  Object.values(libraries[library].classes).forEach(c => {
    if (!c) return
    ret[c.code] = jclone(c)
  })
  return ret
}

/**
 *  Class parents classes
 *  @param {string} classCode - class code
 *  @param {string} library - class library
 *  @param {object} libraries - libraries object
 *  @param {object} modules - modules metadata
 *  @returns {object} class parents. direct and deep extended.
 */
export const classParents = (classCode, library, libraries, modules) => {
  const ret = { direct: [], back: [] }
  const cls = libraries[library]
    ? libraries[library].classes[classCode]
    : modules && modules[library] && modules[library].classes
      ? modules[library].classes[classCode]
      : null
  if (!cls || !Object.keys(cls.extends || {}).length) return ret
  Object.values(cls.extends).forEach(ext => {
    const inf = { ...ext }
    if (ext.module && modules && modules[ext.module] && modules[ext.module].classes[ext.code]) {
      inf.src = modules[ext.module].classes[ext.code]
    }
    if (inf.library) {
      inf.src = libraries[inf.library].classes[inf.code]
      const parents = classParents(inf.code, inf.library, libraries, modules)
      ret.back = [...ret.back, ...parents.direct, ...parents.back]
    }
    ret.direct.push(inf)
  })
  ret.back = ret.back.filter((cls, i, self) => self.indexOf(cls) === i)
  ret.index = [...ret.direct, ...ret.back].map(c => {
    if (c.library) return `library/${c.library}/${c.code}`
    return `module/${c.module}/${c.code}`
  })
  return ret
}

/**
 *  Check if class is parent of other
 *  @param {string} classCode - code of "parent" class
 *  @param {string} classLibrary - library of "parent" class
 *  @param {string} childCode - code of "child" class
 *  @param {string} childLibrary - library of "child" class
 *  @param {object} libraries - libraries object
 *  @param {object} modules - modules metadata
 *  @returns {boolean} is parent or not
 */
export const classIsParentOf = (classCode, classLibrary, childCode, childLibrary, libraries, modules) => {
  const parents = classParents(childCode, childLibrary, libraries, modules)
  return parents.index && (parents.index.includes(`library/${classLibrary}/${classCode}`) || parents.index.includes(`module/${classLibrary}/${classCode}`))
}

/**
 *  Simplified version of parents check only by classes codes
 *  @param {string} parentCode - parent class code
 *  @param {string} childCode - child class code
 *  @param {object} libraries - libraries object
 *  @returns {boolean} is parent or not
 */
export const classIsParentOfClass = (parentCode, childCode, libraries, modules) => {
  let libParent = null
  let libChild = null
  Object.keys(libraries || {}).forEach(libcode => {
    if (Object.keys(libraries[libcode].classes || {}).includes(childCode)) libChild = libcode
    if (Object.keys(libraries[libcode].classes || {}).includes(parentCode)) libParent = libcode
  })
  if (!libParent || !libChild) {
    Object.keys(modules || {}).forEach(modcode => {
      if (Object.keys(modules[modcode].classes || {}).includes(childCode)) libChild = modcode
      if (Object.keys(modules[modcode].classes || {}).includes(parentCode)) libParent = modcode
    })
  }
  if (!libParent || !libChild) return false
  return classIsParentOf(parentCode, libParent, childCode, libChild, libraries, modules)
}

/**
 *  Class combined
 *  @param {string} classCode - class code
 *  @param {string} library - class library
 *  @param {object} libraries - libraries object
 *  @param {object} modules - modules metadata
 *  @returns {object|null} full class combined object
 */
export const classCombined = (code, library, libraries, modules) => {
  const src = libraries[library]
    ? libraries[library]
    : modules && modules[library]
      ? modules[library]
      : null
  if (!src || !src.classes || !src.classes[code]) return null
  const cls = jclone(src.classes[code])
  const parents = classParents(code, library, libraries, modules)
  const list = [...parents.direct, ...parents.back]
  cls.deep = {
    schema: {},
    methods: {},
    overrides: {},
    parents: []
  }
  list.forEach(parent => {
    cls.deep.parents.push(parent.src.code)
    // properties
    Object.keys(parent.src.schema || {}).forEach(fld => {
      if (parent.src.schema[fld].access === 'private') return
      cls.deep.schema[fld] = jclone(parent.src.schema[fld])
      cls.deep.schema[fld].source = {
        library: parent.library,
        libraryName: parent.library
          ? libraries[parent.library].name
          : modules[parent.module].name,
        code: parent.src.code,
        name: parent.src.name
      }
    })
    Object.keys(parent.src.methods || {}).forEach(mcode => {
      if (parent.src.methods[mcode].access === 'private') return
      // parent method is overriden in class
      const over = Object.values(cls.methods || {}).find(m => m.overrides === mcode)
      if (over) {
        cls.deep.overrides[mcode] = jclone(parent.src.methods[mcode])
        cls.deep.overrides[mcode].source = {
          library: parent.library,
          // libraryName: libraries[parent.library].name,
          libraryName: parent.library
            ? libraries[parent.library].name
            : modules[parent.module].name,
          code: parent.src.code,
          name: parent.src.name
        }
        return
      }
      // parent method is overriden in other parent class
      if (Object.values(cls.deep.methods || {}).find(m => m.overrides === mcode)) return
      // or already was checked and moved to overrides
      if (Object.values(cls.deep.overrides || {}).find(m => m.overrides === mcode)) return
      cls.deep.methods[mcode] = jclone(parent.src.methods[mcode])
      cls.deep.methods[mcode].source = {
        library: parent.library,
        // libraryName: libraries[parent.library].name,
        libraryName: parent.library
          ? libraries[parent.library].name
          : modules[parent.module].name,
        code: parent.src.code,
        name: parent.src.name
      }
      // parent method overrides other deep method
      const po = parent.src.methods[mcode].overrides
      const md = cls.deep.methods[po]
      if (po && md) {
        const over = jclone(cls.deep.methods[po])
        delete cls.deep.methods[po]
        cls.deep.overrides[po] = over
      }
    })
  })
  return cls
}

export const actorParents = (src, actors, modules) => {
  // console.log('rap', src, modules)
  const act = src.id
    ? actors[src.id]
    : modules[src.module].classes[src.code]
  const parents = []
  const index = []
  if (!act) return parents
  Object.values(act.extends || {}).forEach(ext => {
    const prnt = modules[ext.module].classes[ext.code]
    if (index.includes(`${ext.module}/${ext.code}`)) return
    index.push(`${ext.module}/${ext.code}`)
    parents.push({ ...prnt, module: ext.module })
    const prntParents = actorParents(ext, actors, modules)
    prntParents.forEach(pp => {
      if (index.includes(`${pp.module}/${pp.code}`)) return
      index.push(`${pp.module}/${pp.code}`)
      parents.push(pp)
    })
  })
  return parents
}

export const actorCombined = (aid, actors, modules) => {
  if (!actors || !modules || !actors[aid]) return null
  const act = actors[aid]
  if (!act) return null
  // const ret = actors[aid]
  const info = jclone(act)
  const parents = actorParents({ id: aid }, actors, modules)
  parents.forEach(prnt => {
    info.schema = { ...(info.schema || {}), ...(prnt.schema || {}) }
    info.methods = { ...(info.methods || {}), ...(prnt.methods || {}) }
    info.events = { ...(info.events || {}), ...(prnt.events || {}) }
  })
  info._parents = parents
  return info
}
