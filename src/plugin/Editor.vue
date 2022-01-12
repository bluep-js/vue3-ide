<script>
import { v4 as uuid } from 'uuid'
import TopBar from './TopBar.vue'
import LibraryContentPanel from './LibraryContentPanel.vue'
import LibraryProperties from './LibraryProperties.vue'

import GraphBuilder from './GraphBuilder.vue'
import GraphVariablesPanel from './GraphVariablesPanel.vue'
import GraphVariablePanel from './GraphVariablePanel.vue'

import EnumBuilder from './EnumBuilder.vue'
import StructBuilder from './StructBuilder.vue'
import ClassBuilder from './ClassBuilder.vue'

import { jclone, waitFor } from './utils.js'
// import { classCombined } from './graph.js'

export default {
  name: 'BluepEditor',
  components: {
    TopBar,
    LibraryContentPanel,
    LibraryProperties,
    GraphBuilder,
    GraphVariablePanel,
    GraphVariablesPanel,
    StructBuilder,
    ClassBuilder,
    EnumBuilder
  },
  props: {
    height: {
      type: String,
      default: 'auto'
    },
    types: {
      type: Object,
      default: () => ({})
    },
    nodes: {
      type: Array,
      default: () => ([])
    },
    libraries: {
      type: Object,
      default: () => ({
        default: {
          code: 'default',
          name: 'Default',
          functions: {},
          classes: {},
          enums: {},
          structs: {},
          events: {}
        }
      })
    },
    actors: {
      type: Object,
      default: () => ({})
    },
    modules: {
      type: Object,
      default: () => ({})
    },
    options: {
      type: Object,
      default: () => ({
        icons: {
          enum: 'fas fa-list-ol',
          struct: 'fab fa-delicious',
          function: 'fas fa-scroll',
          class: 'fas fa-file-code',
          library: 'fas fa-book',
          event: 'fas fa-bell',
          chevronRight: 'fas fa-chevron-right',
          chevronDown: 'fas fa-chevron-down',
          view: 'far fa-eye',
          add: 'fas fa-plus',
          remove: 'fas fa-trash',
          edit: 'fas fa-pencil-alt',
          save: 'fas fa-save',
          run: 'fas fa-play',
          close: 'fas fa-times',
          fw: 'fa-fw'
        },
        // dialogs: {
        // prompt, alert, confirm
        // },
        select: null,
        defaultOnly: false,
        run: true
      })
    }
  },
  emits: [
    'save',
    'run',
    'select'
  ],
  data () {
    return {
      libs: this.libraries,
      isSaved: true,
      currentLibrary: null,
      selectedElement: null,
      selectedVariable: null,
      firstLibs: true,
      dialogs: {}
    }
  },
  created () {
    const opts = this.options
    let lib = null
    let el = null
    if (opts && opts.select) {
      const s = opts.select
      const libcode = s.type === 'library' ? s.code : s.library
      if (this.libs[libcode]) {
        lib = libcode
        const path = `${s.type}s`
        if (this.libs[lib][path] && this.libs[lib][path][s.code]) {
          el = this.libs[lib][path][s.code]
        }
      }
    }
    this.dialogs.alert = opts.dialogs && opts.dialogs.alert ? opts.dialogs.alert : (...args) => new Promise(resolve => {
      const res = alert(...args)
      resolve(res)
    })
    this.dialogs.prompt = opts.dialogs && opts.dialogs.prompt ? opts.dialogs.prompt : (...args) => new Promise(resolve => {
      const res = prompt(...args)
      resolve(res)
    })
    this.dialogs.confirm = opts.dialogs && opts.dialogs.confirm ? opts.dialogs.confirm : (...args) => new Promise(resolve => {
      const res = confirm(...args)
      resolve(res)
    })
    if (lib) {
      this.currentLibrary = lib
    }
    if (el) {
      this.selectedElement = el
    }
  },
  watch: {
    libraries: {
      handler (next) {
        this.libs = next
        if (this.firstLibs) {
          this.firstLibs = false
          this.isSaved = true
          waitFor(0).then(() => {
            const opts = this.options
            let lib = null
            let el = null
            if (opts && opts.select) {
              const s = opts.select
              const libcode = s.type === 'library' ? s.code : s.library
              if (next[libcode]) {
                lib = libcode
                const path = `${s.type}s`
                if (next[lib][path] && next[lib][path][s.code]) {
                  el = next[lib][path][s.code]
                }
              }
            }
            if (lib) {
              this.currentLibrary = lib
            }
            if (el) {
              this.selectedElement = el
            }
          })
        }
      },
      deep: true
    }
  },
  computed: {
    /**
      full list of accessible nodes includes
        variables get/set
        functions calls
        enums2string
        structs wrap/
        modules nodes add/filter
    */
    nodesFull () {
      const ret = [...this.nodes]
      // current function variables
      if (this.libs[this.selectedElement.library].functions[this.selectedElement.code]) {
        const variableGet = this.nodes.find(node => node.code === 'variable/get')
        const variableSet = this.nodes.find(node => node.code === 'variable/set')
        // get nodes
        let paths = ['inputs', 'variables']
        paths.forEach(path => {
          Object.values(this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path]).forEach(slot => {
            const node = jclone(variableGet)
            node.addable = true
            node.name = `Get ${slot.name}`
            node.code += '/' + slot.code
            node.data = {
              context: path,
              code: slot.code,
              name: slot.name,
              type: slot.type
            }
            node.outputs[slot.code] = jclone(slot)
            ret.push(node)
          })
        })
        // set nodes
        paths = ['outputs', 'variables']
        paths.forEach(path => {
          Object.values(this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path]).forEach(slot => {
            const node = jclone(variableSet)
            node.addable = true
            node.name = `Set ${slot.name}`
            node.code += '/' + slot.code
            node.data = {
              context: path,
              code: slot.code,
              name: slot.name,
              type: slot.type
            }
            node.inputs[slot.code] = jclone(slot)
            ret.push(node)
          })
        })
      }
      // functions nodes
      const graphFunction = this.nodes.find(node => node.code === 'graph/function')
      Object.keys(this.libs[this.currentLibrary].functions).forEach(fid => {
        const fn = this.libs[this.currentLibrary].functions[fid]
        const node = jclone(graphFunction)
        node.addable = true
        node.code += `/${fid}`
        node.data = {
          library: fn.library,
          fid: fid
        }
        node.name = fn.name
        Object.keys(fn.context.inputs).forEach(slot => {
          node.inputs[slot] = jclone(fn.context.inputs[slot])
        })
        Object.keys(fn.context.outputs).forEach(slot => {
          node.outputs[slot] = jclone(fn.context.outputs[slot])
        })
        ret.push(node)
      })
      // enum nodes
      const enumFunctions = this.nodes.filter(node => node.code.startsWith('enum/'))
      enumFunctions.forEach(enumFunction => {
        // console.log('enum2string', enum2stringFunction)
        Object.keys(this.libs[this.currentLibrary].enums || {}).forEach(eid => {
          const enm = this.libs[this.currentLibrary].enums[eid]
          const node = jclone(enumFunction)
          node.addable = true
          node.code += `/${eid}`
          node.data = jclone(enm)
          node.name = `"${enm.name}" ${node.name}`
          Object.keys(node.inputs).forEach(slot => {
            // node.inputs[slot] = jclone(fn.context.inputs[slot])
            if (node.inputs[slot].type.startsWith('bluep/enum')) {
              node.inputs[slot].type += `/${eid}`
            }
          })
          Object.keys(node.outputs).forEach(slot => {
            // node.outputs[slot] = jclone(fn.context.outputs[slot])
            if (node.outputs[slot].type.startsWith('bluep/enum')) {
              node.outputs[slot].type += `/${eid}`
            }
          })
          ret.push(node)
        })

        // modules enums
        Object.values(this.modules || {}).forEach(m => {
          Object.keys(m.enums || {}).forEach(eid => {
            const enm = m.enums[eid]
            const node = jclone(enumFunction)
            node.addable = true
            node.code += `/${eid}`
            node.data = jclone(enm)
            node.name = `"${enm.name}" ${node.name}`
            Object.keys(node.inputs).forEach(slot => {
              // node.inputs[slot] = jclone(fn.context.inputs[slot])
              if (node.inputs[slot].type.startsWith('bluep/enum')) {
                node.inputs[slot].type += `/${eid}`
              }
            })
            Object.keys(node.outputs).forEach(slot => {
              // node.outputs[slot] = jclone(fn.context.outputs[slot])
              if (node.outputs[slot].type.startsWith('bluep/enum')) {
                node.outputs[slot].type += `/${eid}`
              }
            })
            ret.push(node)
          })
        })
      })

      // struct functions
      const structPackFunction = this.nodes.find(node => node.code === 'struct/pack')
      const structUnpackFunction = this.nodes.find(node => node.code === 'struct/unpack')
      const structToObjectFunction = this.nodes.find(node => node.code === 'struct/toobject')
      const structFromObjectFunction = this.nodes.find(node => node.code === 'struct/fromobject')
      // library structs
      Object.keys(this.libs[this.currentLibrary].structs || {}).forEach(sid => {
        const sct = this.libs[this.currentLibrary].structs[sid]

        const nodePack = jclone(structPackFunction)
        nodePack.addable = true
        nodePack.code += `/${sid}`
        nodePack.data = jclone(sct)
        nodePack.name = sct.name
        Object.keys(sct.schema).forEach(field => {
          nodePack.inputs[field] = jclone(sct.schema[field])
        })
        nodePack.outputs.struct.type += `/${sct.code}`
        ret.push(nodePack)

        const nodeUnpack = jclone(structUnpackFunction)
        nodeUnpack.addable = true
        nodeUnpack.code += `/${sid}`
        nodeUnpack.data = jclone(sct)
        nodeUnpack.name = sct.name
        Object.keys(sct.schema).forEach(field => {
          nodeUnpack.outputs[field] = jclone(sct.schema[field])
        })
        nodeUnpack.inputs.struct.type += `/${sct.code}`
        ret.push(nodeUnpack)

        const nodeToObject = jclone(structToObjectFunction)
        nodeToObject.addable = true
        nodeToObject.code += `/${sid}`
        nodeToObject.data = jclone(sct)
        nodeToObject.name = sct.name
        nodeToObject.inputs.struct.type += `/${sct.code}`
        ret.push(nodeToObject)

        const nodeFromObject = jclone(structFromObjectFunction)
        nodeFromObject.addable = true
        nodeFromObject.code += `/${sid}`
        nodeFromObject.data = jclone(sct)
        nodeFromObject.name = sct.name
        nodeFromObject.outputs.struct.type += `/${sct.code}`
        ret.push(nodeFromObject)
      })

      // modules structs
      Object.values(this.modules || {}).forEach(m => {
        Object.keys(m.structs || {}).forEach(sid => {
          const sct = m.structs[sid]

          const nodePack = jclone(structPackFunction)
          nodePack.addable = true
          nodePack.code += `/${sid}`
          nodePack.data = jclone(sct)
          nodePack.name = sct.name
          Object.keys(sct.schema).forEach(field => {
            nodePack.inputs[field] = jclone(sct.schema[field])
          })
          nodePack.outputs.struct.type += `/${sct.code}`
          ret.push(nodePack)

          const nodeUnpack = jclone(structUnpackFunction)
          nodeUnpack.addable = true
          nodeUnpack.code += `/${sid}`
          nodeUnpack.data = jclone(sct)
          nodeUnpack.name = sct.name
          Object.keys(sct.schema).forEach(field => {
            nodeUnpack.outputs[field] = jclone(sct.schema[field])
          })
          nodeUnpack.inputs.struct.type += `/${sct.code}`
          ret.push(nodeUnpack)

          const nodeToObject = jclone(structToObjectFunction)
          nodeToObject.addable = true
          nodeToObject.code += `/${sid}`
          nodeToObject.data = jclone(sct)
          nodeToObject.name = sct.name
          nodeToObject.inputs.struct.type += `/${sct.code}`
          ret.push(nodeToObject)

          const nodeFromObject = jclone(structFromObjectFunction)
          nodeFromObject.addable = true
          nodeFromObject.code += `/${sid}`
          nodeFromObject.data = jclone(sct)
          nodeFromObject.name = sct.name
          nodeFromObject.outputs.struct.type += `/${sct.code}`
          ret.push(nodeFromObject)
        })
      })

      // CLASSES
      const sec = this.selectedElement ? this.selectedElement.class : null
      if (sec) {
        const classThis = this.nodes.find(node => node.code === 'class/this')
        const node = jclone(classThis)
        node.addable = true
        node.code += `/${sec}`
        node.data = {
          class: sec
        }
        node.outputs.object.type += `/${sec}`
        console.log('this', node)
        ret.push(node)
      }
      Object.keys(this.libraries[this.currentLibrary].classes || {}).forEach(clsCode => {
        // const cls = classCombined(clsCode, this.currentLibrary, this.libraries, this.modules)
        const cls = this.libraries[this.currentLibrary].classes[clsCode]
        // console.log(sec, 'cls', cls)
        /**/
        const classVariableGet = this.nodes.find(node => node.code === 'class/get')
        const classVariableSet = this.nodes.find(node => node.code === 'class/set')
        Object.values(cls.schema || {}).forEach(prop => {
          // console.log('prop', cls.name, prop, cls.code, sec)
          if (prop.access !== 'public' && cls.code !== sec) return
          const node = jclone(classVariableGet)
          node.addable = true
          node.name = `${cls.name}::${prop.name}`
          node.code += `/${cls.code}/${prop.code}`
          node.data = {
            context: 'schema',
            code: prop.code,
            class: cls.code
          }
          node.outputs[prop.code] = jclone(prop)
          node.inputs.object.type += `/${cls.code}`
          ret.push(node)

          const node2 = jclone(classVariableSet)
          node2.addable = true
          node2.name = `Set ${cls.name}::${prop.name}`
          node2.code += `/${cls.code}/${prop.code}`
          node2.data = {
            context: 'schema',
            code: prop.code,
            class: cls.code
          }
          node2.inputs[prop.code] = jclone(prop)
          node2.inputs.object.type += `/${cls.code}`
          ret.push(node2)
        })
        /**/
        const classMethod = this.nodes.find(node => node.code === 'class/method')
        Object.values(cls.methods || {}).forEach(mth => {
          if (mth.access !== 'public' && cls.code !== sec) return
          if (mth.type === 'method') {
            const node = jclone(classMethod)
            node.addable = true
            node.name = `${cls.name}::${mth.name}`
            node.code += `/${cls.code}/${mth.code}`
            node.data = {
              context: 'schema',
              code: mth.code,
              class: cls.code,
              library: cls.library
            }
            Object.keys(mth.context.inputs || {}).forEach(fcode => {
              node.inputs[fcode] = jclone(mth.context.inputs[fcode])
            })
            Object.keys(mth.context.outputs || {}).forEach(fcode => {
              node.outputs[fcode] = jclone(mth.context.outputs[fcode])
            })
            node.inputs.object.type += `/${cls.code}`
            ret.push(node)
          }
        })
      })
      /*
      if (this.selectedElement && (this.selectedElement.type === 'constructor' || this.selectedElement.type === 'method')) {
        // const cls = classCombined(this.selectedElement
        // class variables
        const classVariableGet = this.nodes.find(node => node.code === 'class/get')
        const classVariableSet = this.nodes.find(node => node.code === 'class/set')
        // get nodes
        let paths = ['inputs', 'variables']
        paths.forEach(path => {
          Object.values(this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path]).forEach(slot => {
            const node = jclone(variableGet)
            node.addable = true
            node.name = `Get ${slot.name}`
            node.code += '/' + slot.code
            node.data = {
              context: path,
              code: slot.code,
              name: slot.name,
              type: slot.type
            }
            node.outputs[slot.code] = jclone(slot)
            ret.push(node)
          })
        })
        // set nodes
        paths = ['outputs', 'variables']
        paths.forEach(path => {
          Object.values(this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path]).forEach(slot => {
            const node = jclone(variableSet)
            node.addable = true
            node.name = `Set ${slot.name}`
            node.code += '/' + slot.code
            node.data = {
              context: path,
              code: slot.code,
              name: slot.name,
              type: slot.type
            }
            node.inputs[slot.code] = jclone(slot)
            ret.push(node)
          })
        })
      }
      /**/

      // Actors
      const actorGet = this.nodes.find(node => node.code === 'actor/get')
      const actorMethod = this.nodes.find(node => node.code === 'actor/method')
      const actorState = this.nodes.find(node => node.code === 'actor/state')
      const doneActors = {}
      Object.values(this.actors).forEach(actor => {
        if (doneActors[actor.code]) return
        const getNode = jclone(actorGet)
        getNode.addable = true
        getNode.name = actor.name
        getNode.code += '/' + actor.code
        getNode.outputs.actor.name = actor.name
        getNode.outputs.actor.type += '/' + actor.code
        getNode.data = { actor: actor.id }
        ret.push(getNode)

        const stateNode = jclone(actorState)
        stateNode.addable = true
        stateNode.name = actor.name
        stateNode.code += '/' + actor.code
        stateNode.inputs.actor.name = actor.name
        stateNode.inputs.actor.type += '/' + actor.code
        stateNode.data = { actor: actor.id }
        Object.keys(actor.state).forEach(field => {
          stateNode.outputs[field] = jclone(actor.state[field])
        })
        ret.push(stateNode)

        Object.values(actor.methods).forEach(method => {
          const mNode = jclone(actorMethod)
          mNode.addable = true
          mNode.code += `/${actor.id}/method/${method.code}`
          mNode.name = actor.name + ' :: ' + method.name + '()'
          mNode.data = {
            actor: actor.id,
            method: method.code
          }
          mNode.inputs.actor.name = actor.name
          mNode.inputs.actor.type += `/${actor.code}`
          Object.keys(method.inputs || {}).forEach(field => {
            mNode.inputs[field] = JSON.parse(JSON.stringify(method.inputs[field]))
          })
          Object.keys(method.outputs || {}).forEach(field => {
            mNode.outputs[field] = JSON.parse(JSON.stringify(method.outputs[field]))
          })
          ret.push(mNode)
        })

        doneActors[actor.code] = true
      })

      return ret

      /*
      let base = [...ret]
      Object.values(this.modules || {}).forEach(m => {
        if (!m.ide || !m.ide.nodes) {
          return
        }
        let nodesFn = null
        if (typeof m.ide.nodes === 'function') {
          nodesFn = m.ide.nodes
        } else {
          try {
            // eslint-disable-next-line
            nodesFn = eval(m.ide.nodes)
          } catch (err) {
            // eslint-disable-next-line
            console.error('eval failed', err)
            nodesFn = null
          }
        }
        if (typeof nodesFn !== 'function') {
          return
        }
        const ml = nodesFn(this.libraries, this.currentLibrary, this.actors, this.nodes)
        if (Array.isArray(ml)) {
          base = [...base, ...ml]
        }
      })
      return base
      */
    },
    /**
      full list of types includes
        basic/* types
        enums types
        classes types
        modules types
    */
    typesFull () {
      // console.log('types full', this.types)
      const ret = {}
      if (!Object.keys(this.types || {}).length) {
        // eslint-disable-next-line
        console.error('no types!')
        return
      }
      Object.values(this.types).forEach(tp => {
        if (!tp.code.startsWith('basic')) return
        // if (['basic/execute', 'basic/object'].includes(tp.code)) return
        ret[tp.code] = tp
      })
      Object.values(this.libs[this.currentLibrary].enums || {})
        .forEach(enm => {
          const tp = jclone(this.types['bluep/enum'])
          tp.code += `/${enm.code}`
          tp.name = `Enum: ${enm.name}`
          ret[tp.code] = tp
        })
      Object.values(this.libs[this.currentLibrary].structs || {})
        .forEach(enm => {
          const tp = jclone(this.types['bluep/struct'])
          tp.code += `/${enm.code}`
          tp.name = `Struct: ${enm.name}`
          ret[tp.code] = tp
        })
      Object.values(this.libs[this.currentLibrary].classes || {})
        .forEach(enm => {
          const tp = jclone(this.types['bluep/class'])
          tp.code += `/${enm.code}`
          tp.name = `Class: ${enm.name}`
          ret[tp.code] = tp
        })
      // actors as classes types
      Object.values(this.actors)
        .forEach(actor => {
          const tp = jclone(this.types['bluep/class'])
          tp.code += `/${actor.code}`
          tp.name = `Actor: ${actor.name}`
          ret[tp.code] = tp
        })

      // modules types
      let base = { ...ret }
      Object.values(this.modules).forEach(m => {
        // module enums
        Object.values(m.enums || {})
          .forEach(enm => {
            const tp = jclone(this.types['bluep/enum'])
            tp.code += `/${enm.code}`
            tp.name = `Enum: ${enm.name}`
            ret[tp.code] = tp
          })
        // module structs
        Object.values(m.structs || {})
          .forEach(enm => {
            const tp = jclone(this.types['bluep/struct'])
            tp.code += `/${enm.code}`
            tp.name = `Struct: ${enm.name}`
            ret[tp.code] = tp
          })
        // module defined types
        // to override automated color
        const tps = jclone(m.types || {})
        base = { ...base, ...tps }
      })
      return base
    }
  },
  methods: {
    /**
      Creates new library and select it for view
    */
    createLibrary (name) {
      const code = uuid()
      if (!this.libs) {
        this.libs = {}
      }
      this.libs[code] = {
        name,
        code,
        options: {
          deleteable: true
        },
        events: {},
        functions: {},
        classes: {},
        structs: {},
        enums: {}
      }
      this.currentLibrary = code
      this.selectedElement = {
        type: 'library',
        library: code,
        code,
        name
      }
      this.$emit('select', {
        type: 'library',
        code
      })
      this.selectedVariable = null
    },
    /**
      Selects library {code} as main element
    */
    selectLibrary (code) {
      this.currentLibrary = code
      this.selectedVariable = null
      this.$emit('select', {
        type: 'library',
        code
      })
    },
    /**
      Selects current library as main element
    */
    viewCurrentLibrary () {
      this.selectedElement = {
        type: 'library',
        name: this.libs[this.currentLibrary].name,
        code: this.libs[this.currentLibrary].code
      }
      this.$emit('select', this.selectedElement)
      this.selectedVariable = null
    },
    /**
      Emits 'save' event on save click
    */
    async saveClick () {
      const ok = await this.dialogs.confirm('Save Libraries?')
      if (!ok) return
      this.$emit('save', this.libs)
      this.isSaved = true
    },
    /**
      Emits 'run' event on run click
    */
    runClick () {
      this.$emit('run', this.selectedElement)
    },
    /**
      Updates library
    */
    updateLibrary () {
      // console.log('lib upda', data)
    },
    /**
      Removes library
    */
    deleteLibrary () {
      // console.log('lib dele', data)
    },
    /**
      Add new element to library
    */
    addToLibrary (info) {
      // new function or event
      // console.log('add2lib', info)
      if (info.type === 'function' || info.type === 'event') {
        const code = uuid()
        const data = {
          code,
          name: info.name,
          type: 'function',
          library: this.currentLibrary,
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
        const graphCall = this.nodes.find(n => n.code === 'graph/call')
        if (!graphCall) {
          // eslint-disable-next-line
          console.error('no nodes!')
          return
        }
        const callNode = jclone(graphCall)
        const now = new Date()
        callNode.id = `${callNode.code}_${now.getTime()}`
        // module event
        if (info.type === 'event' && info.module && this.modules[info.module]) {
          const eventCode = info.code
          const eventInfo = this.modules[info.module].events[eventCode]
          data.event = { ...info, config: {}, info: jclone(eventInfo) }
          data.name = eventInfo.name
          Object.keys(eventInfo.outputs || {}).forEach(key => {
            const f = jclone(eventInfo.outputs[key])
            data.context.inputs[key] = f
            callNode.outputs[key] = f
          })
        }
        // actor event
        if (info.type === 'event' && info.actor && this.actors[info.actor]) {
          const eventCode = info.code
          const eventInfo = this.actors[info.actor].events[eventCode]
          data.event = { ...info, info: jclone(eventInfo) }
          data.name = this.actors[info.actor].name + ' ' + eventInfo.name
          Object.keys(eventInfo.outputs || {}).forEach(key => {
            const f = jclone(eventInfo.outputs[key])
            data.context.inputs[key] = f
            callNode.outputs[key] = f
          })
        }
        /**/
        if (!this.libs[this.currentLibrary].functions) {
          this.libs[this.currentLibrary].functions = {}
        }
        data.graph.nodes[callNode.id] = jclone(callNode)
        data.layout.parts[callNode.id] = {
          x: 1010,
          y: 1010
        }
        data.entry = callNode.id
        console.log('new', callNode)
        this.libs[this.currentLibrary].functions[code] = data
        this.isSaved = false
        this.selectedElement = this.libs[this.currentLibrary].functions[code]
        this.$emit('select', {
          type: 'function',
          library: this.currentLibrary,
          code
        })
      }
      // new enum
      if (info.type === 'enum') {
        const code = uuid()
        if (!this.libs[this.currentLibrary].enums) {
          this.libs[this.currentLibrary].enums = {}
        }
        this.libs[this.currentLibrary].enums[code] = {
          code,
          name: info.name,
          type: 'enum',
          library: this.currentLibrary,
          values: {}
        }
        this.isSaved = false
        this.selectedElement = this.libs[this.currentLibrary].enums[code]
        this.$emit('select', {
          type: 'enum',
          library: this.currentLibrary,
          code
        })
      }
      // new struct
      if (info.type === 'struct') {
        const code = uuid()
        if (!this.libs[this.currentLibrary].structs) {
          this.libs[this.currentLibrary].structs = {}
        }
        this.libs[this.currentLibrary].structs[code] = {
          code,
          name: info.name,
          type: 'struct',
          library: this.currentLibrary,
          schema: {}
        }
        this.isSaved = false
        this.selectedElement = this.libs[this.currentLibrary].structs[code]
        this.$emit('select', {
          type: 'struct',
          library: this.currentLibrary,
          code
        })
      }
      // new class
      if (info.type === 'class') {
        const code = uuid()
        if (!this.libs[this.currentLibrary].classes) {
          this.libs[this.currentLibrary].classes = {}
        }
        this.libs[this.currentLibrary].classes[code] = {
          code,
          name: info.name,
          type: 'class',
          library: this.currentLibrary,
          extends: {},
          // class properties
          schema: {},
          // class methods
          methods: {}
        }
        this.isSaved = false
        this.selectedElement = this.libs[this.currentLibrary].classes[code]
        this.$emit('select', {
          type: 'class',
          library: this.currentLibrary,
          code
        })
      }
    },
    /**
      Select library element
    */
    selectElement (info) {
      // console.log('select', info)
      this.selectedElement = info
      this.selectedVariable = null
      this.$emit('select', {
        type: info.type,
        library: this.currentLibrary,
        code: info.code
      })
    },
    /**
      Deletes library element
    */
    deleteElement (el) {
      if (this.selectedElement && this.selectedElement.type === el.type && this.selectedElement.code === el.code) {
        this.selectedElement = null
        this.$emit('select', null)
      }
      if (el.type === 'class') {
        delete this.libs[el.library].classes[el.code]
        this.isSaved = false
      }
      if (el.type === 'function') {
        delete this.libs[el.library].functions[el.code]
        this.isSaved = false
      }
      if (el.type === 'struct') {
        delete this.libs[el.library].structs[el.code]
        this.isSaved = false
      }
      if (el.type === 'enum') {
        delete this.libs[el.library].enums[el.code]
        this.isSaved = false
      }
    },

    // =============================================

    //                    FUNCTIONS

    // =============================================
    /**
      Deletes function edge
    */
    deleteFunctionEdge (eid) {
      if (!this.selectedElement || this.selectedElement.type !== 'function') return
      const edge = this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.edges[eid]
      if (!edge) return
      if (this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[edge.from.node].outputs[edge.from.slot].connections) delete this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[edge.from.node].outputs[edge.from.slot].connections[eid]
      if (this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[edge.to.node].inputs[edge.to.slot].connections) delete this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[edge.to.node].inputs[edge.to.slot].connections[eid]
      delete this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.edges[eid]
      delete this.libs[this.selectedElement.library].functions[this.selectedElement.code].layout.parts[eid]
    },

    /**
      Add function variable and select it
    */
    addFunctionVariable (path) {
      if (!this.selectedElement || this.selectedElement.type !== 'function') return
      const vid = uuid()
      const varn = Object.keys(this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path]).length
      const slot = {
        code: vid,
        name: `${path} ${varn}`,
        type: 'basic/boolean'
      }
      this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path][vid] = slot
      Object.keys(this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[nid]
        if (node.code === 'graph/call' && path === 'inputs') {
          node.outputs[slot.code] = JSON.parse(JSON.stringify(slot))
        }
        if (node.code === 'graph/return' && path === 'outputs') {
          node.inputs[slot.code] = JSON.parse(JSON.stringify(slot))
        }
      })
      this.selectedVariable = {
        variable: this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[path][vid],
        context: path
      }
      this.isSaved = false
    },
    /**
      Edit function variable
    */
    editFunctionVariable (info) {
      if (!this.selectedElement || this.selectedElement.type !== 'function') return
      this.selectedVariable = {
        variable: this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[info.path][info.code],
        context: info.path
      }
    },
    /**
      Remove function variable
    */
    removeFunctionVariable (info) {
      if (!this.selectedElement || this.selectedElement.type !== 'function') return
      if (this.selectedVariable && info.path === this.selectedVariable.context && info.code === this.selectedVariable.variable.code) this.deselectFunctionVariable()
      delete this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[info.path][info.code]
      Object.keys(this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[nid]
        if (node.code === 'graph/call' && info.path === 'inputs') {
          Object.keys(node.outputs[info.code].connections || {}).forEach(eid => this.deleteFunctionEdge(eid))
          delete node.outputs[info.code]
        }
        if (node.code === 'graph/return' && info.path === 'outputs') {
          Object.keys(node.inputs[info.code].connections || {}).forEach(eid => this.deleteFunctionEdge(eid))
          delete node.inputs[info.code]
        }
      })
      this.isSaved = false
    },
    /**
      Deselect function variable
    */
    deselectFunctionVariable () {
      this.selectedVariable = null
    },
    /**
      Changes selected function variable
    */
    selectedFunctionVariableChanged (data) {
      this.libs[this.selectedElement.library].functions[this.selectedElement.code].context[this.selectedVariable.context][this.selectedVariable.variable.code] = {
        ...JSON.parse(JSON.stringify(this.selectedVariable.variable)),
        ...JSON.parse(JSON.stringify(data))
      }
      Object.keys(this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[nid]
        // inputs call nodes
        if (node.code === 'graph/call' && this.selectedVariable.context === 'inputs') {
          const next = {
            ...JSON.parse(JSON.stringify(node.outputs[this.selectedVariable.variable.code])),
            ...JSON.parse(JSON.stringify(this.selectedVariable.variable))
          }
          node.outputs[this.selectedVariable.variable.code] = next
        }
        // outputs call nodes
        if (node.code === 'graph/return' && this.selectedVariable.context === 'outputs') {
          const next = {
            ...JSON.parse(JSON.stringify(node.inputs[this.selectedVariable.variable.code])),
            ...JSON.parse(JSON.stringify(this.selectedVariable.variable))
          }
          node.inputs[this.selectedVariable.variable.code] = next
        }
      })
      this.isSaved = false
    },
    /**
      Changes selected function variable type
    */
    selectedFunctionVariableTypeChanged () {
      Object.keys(this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].functions[this.selectedElement.code].graph.nodes[nid]
        if (node.code === 'graph/call' && this.selectedVariable.context === 'inputs') {
          Object.keys(node.outputs[this.selectedVariable.variable.code].connections || {}).forEach(eid => this.deleteFunctionEdge(eid))
        }
        if (node.code === 'graph/return' && this.selectedVariable.context === 'outputs') {
          Object.keys(node.inputs[this.selectedVariable.variable.code].connections || {}).forEach(eid => this.deleteFunctionEdge(eid))
        }
      })
    },
    /**
      Update selected function name
    */
    updateSelectedFunctionName (next) {
      this.libs[this.selectedElement.library].functions[this.selectedElement.code].name = next
      this.isSaved = false
    },
    /**
      Update selected function config
    */
    updateSelectedFunctionConfig (next) {
      this.libs[this.selectedElement.library].functions[this.selectedElement.code].event.config = next
      this.isSaved = false
    },

    // =============================================

    //                    CLASSES

    // =============================================
    /**
      Updates class manually
    */
    async updateSelectedClass (next) {
      this.libs[this.selectedElement.library].classes[this.selectedElement.code] = next
      await waitFor(0)
      this.isSaved = false
    },

    /**
      Deletes class function edge
    */
    deleteClassFunctionEdge (eid) {
      if (!this.selectedElement || !(this.selectedElement.type === 'constructor' || this.selectedElement.type === 'method')) return
      const edge = this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.edges[eid]
      console.log('dcfe', edge)
      if (!edge) return
      if (this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[edge.from.node].outputs[edge.from.slot].connections) delete this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[edge.from.node].outputs[edge.from.slot].connections[eid]
      if (this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[edge.to.node].inputs[edge.to.slot].connections) delete this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[edge.to.node].inputs[edge.to.slot].connections[eid]
      delete this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.edges[eid]
      delete this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].layout.parts[eid]
    },

    /**
      Add function variable and select it
    */
    addClassFunctionVariable (path) {
      // console.log('add cfv', path)
      /**/
      if (!this.selectedElement || !(this.selectedElement.type !== 'constructor' || this.selectedElement.type === 'method')) return
      const vid = uuid()
      const varn = Object.keys(this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].context[path]).length
      const slot = {
        code: vid,
        name: `${path} ${varn}`,
        type: 'basic/boolean'
      }
      this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].context[path][vid] = slot
      Object.keys(this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[nid]
        if (node.code === 'graph/call' && path === 'inputs') {
          node.outputs[slot.code] = jclone(slot)
        }
        if (node.code === 'graph/return' && path === 'outputs') {
          node.inputs[slot.code] = jclone(slot)
        }
      })
      this.selectedVariable = {
        variable: this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].context[path][vid],
        context: path
      }
      this.isSaved = false
      /**/
    },
    /**
      Edit function variable
    */
    editClassFunctionVariable (info) {
      // console.log('select cfv', info)
      if (!this.selectedElement || !(this.selectedElement.type === 'constructor' || this.selectedElement.type === 'method')) return
      this.selectedVariable = {
        variable: this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].context[info.path][info.code],
        context: info.path
      }
      console.log('select cfv', this.selectedVariable)
    },
    /**
      Remove function variable
    */
    removeClassFunctionVariable (info) {
      // console.log('remove cfv', info)
      /**/
      // if (!this.selectedElement || this.selectedElement.type !== 'function') return
      if (!this.selectedElement || !(this.selectedElement.type === 'constructor' || this.selectedElement.type === 'method')) return
      if (this.selectedVariable && info.path === this.selectedVariable.context && info.code === this.selectedVariable.variable.code) this.deselectClassFunctionVariable()
      delete this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].context[info.path][info.code]
      Object.keys(this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[nid]
        if (node.code === 'graph/call' && info.path === 'inputs') {
          Object.keys(node.outputs[info.code].connections || {}).forEach(eid => this.deleteClassFunctionEdge(eid))
          delete node.outputs[info.code]
        }
        if (node.code === 'graph/return' && info.path === 'outputs') {
          Object.keys(node.inputs[info.code].connections || {}).forEach(eid => this.deleteClassFunctionEdge(eid))
          delete node.inputs[info.code]
        }
      })
      this.isSaved = false
      /**/
    },
    /**
      Deselect function variable
    */
    deselectClassFunctionVariable () {
      this.selectedVariable = null
    },
    /**
      Changes selected function variable
    */
    selectedClassFunctionVariableChanged (data) {
      console.log('changed cfv', data)
      /**/
      this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].context[this.selectedVariable.context][this.selectedVariable.variable.code] = {
        ...jclone(this.selectedVariable.variable),
        ...jclone(data)
      }
      Object.keys(this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[nid]
        // inputs call nodes
        if (node.code === 'graph/call' && this.selectedVariable.context === 'inputs') {
          const next = {
            ...jclone(node.outputs[this.selectedVariable.variable.code]),
            ...jclone(this.selectedVariable.variable)
          }
          node.outputs[this.selectedVariable.variable.code] = next
        }
        // outputs call nodes
        if (node.code === 'graph/return' && this.selectedVariable.context === 'outputs') {
          const next = {
            ...jclone(node.inputs[this.selectedVariable.variable.code]),
            ...jclone(this.selectedVariable.variable)
          }
          node.inputs[this.selectedVariable.variable.code] = next
        }
      })
      this.isSaved = false
      /**/
    },
    /**
      Changes selected function variable type
    */
    selectedClassFunctionVariableTypeChanged () {
      console.log('type changed cfv')
      /**/
      Object.keys(this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes).forEach(nid => {
        const node = this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].graph.nodes[nid]
        if (node.code === 'graph/call' && this.selectedVariable.context === 'inputs') {
          Object.keys(node.outputs[this.selectedVariable.variable.code].connections || {}).forEach(eid => this.deleteClassFunctionEdge(eid))
        }
        if (node.code === 'graph/return' && this.selectedVariable.context === 'outputs') {
          Object.keys(node.inputs[this.selectedVariable.variable.code].connections || {}).forEach(eid => this.deleteClassFunctionEdge(eid))
        }
      })
      this.isSaved = false
      /**/
    },
    /**
      Update selected function name
    */
    updateSelectedClassFunctionName (next) {
      console.log('update cfv', next)
      /**/
      this.libs[this.selectedElement.library].classes[this.selectedElement.class].methods[this.selectedElement.code].name = next
      this.isSaved = false
      /**/
    }
  }
}
</script>

<template>
<div class="editor" :style="{
  height: height
}">
  <div class="top-bar">
    <TopBar
      :libraries="libs"
      :currentLibrary="currentLibrary"
      :selectedElement="selectedElement"
      :isSaved="isSaved"
      :icons="options.icons"
      :canRun="options.canRun"
      @selectLibrary="selectLibrary"
      @createLibrary="createLibrary"
      @viewLibrary="viewCurrentLibrary"
      @saveClick="saveClick"
      @runClick="runClick"
    />
  </div>
  <div class="main-area">
    <div v-if="currentLibrary" class="left-bar">
      <LibraryContentPanel
        :libraries="libs"
        :modules="modules"
        :actors="actors"
        :currentLibrary="currentLibrary"
        :selectedElement="selectedElement"
        :icons="options.icons"
        @addToLibrary="addToLibrary"
        @selectElement="selectElement"
        @deleteElement="deleteElement"
      />
      <GraphVariablesPanel
        v-if="selectedElement?.type === 'function'"
        :fn="selectedElement"
        :isMethod="false"
        :types="typesFull"
        :icons="options.icons"
        @addVariable="addFunctionVariable"
        @editVariable="editFunctionVariable"
        @deleteVariable="removeFunctionVariable"
        @updateName="updateSelectedFunctionName"
        @updateConfig="updateSelectedFunctionConfig"
      />
      <GraphVariablesPanel
        v-if="selectedElement?.type === 'method' || selectedElement?.type === 'constructor'"
        :fn="selectedElement"
        :cls="libraries[selectedElement.library].classes[selectedElement.class]"
        :isMethod="true"
        :types="typesFull"
        :icons="options.icons"
        @addVariable="addClassFunctionVariable"
        @editVariable="editClassFunctionVariable"
        @deleteVariable="removeClassFunctionVariable"
        @updateName="updateSelectedClassFunctionName"
      />
    </div>
    <div class="paper-area">
      <LibraryProperties
        v-if="selectedElement?.type === 'library'"
        :library="libs[currentLibrary]"
        :icons="options.icons"
        @updateLibrary="updateLibrary"
        @deleteLibrary="deleteLibrary"
      />
      <GraphBuilder
        :libraries="libs"
        :types="typesFull"
        :nodes="nodesFull"
        :currentLibrary="currentLibrary"
        :icons="options.icons"
        v-if="selectedElement?.type === 'function'"
        v-model="selectedElement"
        @update:modelValue="libs[selectedElement.library].functions[selectedElement.code] = $event; isSaved = false"
      />
      <GraphBuilder
        :libraries="libs"
        :types="typesFull"
        :nodes="nodesFull"
        :currentLibrary="currentLibrary"
        :icons="options.icons"
        v-if="selectedElement?.type === 'method' || selectedElement?.type === 'constructor'"
        v-model="selectedElement"
        @update:modelValue="libs[selectedElement.library].classes[selectedElement.class].methods[selectedElement.code] = $event; isSaved = false"
      />
      <EnumBuilder
        :libraries="libs"
        :types="typesFull"
        :currentLibrary="currentLibrary"
        :icons="options.icons"
        v-if="selectedElement?.type === 'enum'"
        v-model="selectedElement"
        @update:modelValue="libs[selectedElement.library].enums[selectedElement.code] = $event; isSaved = false"
      />
      <StructBuilder
        :libraries="libs"
        :types="typesFull"
        :currentLibrary="currentLibrary"
        :icons="options.icons"
        v-if="selectedElement?.type === 'struct'"
        v-model="selectedElement"
        @update:modelValue="libs[selectedElement.library].structs[selectedElement.code] = $event; isSaved = false"
      />
      <ClassBuilder
        :libraries="libs"
        :modules="modules"
        :nodes="nodes"
        :dialogs="dialogs"
        :types="typesFull"
        :currentLibrary="currentLibrary"
        :icons="options.icons"
        v-if="selectedElement?.type === 'class'"
        v-model="selectedElement"
        @update:modelValue="updateSelectedClass"
      />
      <!--
        v-model="selectedElement"
        v-model="libs[selectedElement.library].functions[selectedElement.code]"
      -->
      <div v-if="!selectedElement">
        Viewer
      </div>
    </div>
    <div v-if="selectedVariable" class="right-bar">
      <GraphVariablePanel
        v-if="selectedVariable && selectedElement.type === 'function'"
        :libraries="libs"
        :currentLibrary="currentLibrary"
        :variable="selectedVariable.variable"
        :context="libs[selectedElement.library].functions[selectedElement.code].context"
        :types="typesFull"
        :direction="selectedVariable.context"
        :icons="options.icons"
        @closeMe="deselectFunctionVariable"
        @variableUpdated="selectedFunctionVariableChanged"
        @typeChanged="selectedFunctionVariableTypeChanged"
      />
      <GraphVariablePanel
        v-if="selectedVariable && (selectedElement.type === 'method' || selectedElement.type === 'constructor')"
        :libraries="libs"
        :currentLibrary="currentLibrary"
        :variable="selectedVariable.variable"
        :context="libs[selectedElement.library].classes[selectedElement.class].methods[selectedElement.code].context"
        :types="typesFull"
        :direction="selectedVariable.context"
        :icons="options.icons"
        @closeMe="deselectClassFunctionVariable"
        @variableUpdated="selectedClassFunctionVariableChanged"
        @typeChanged="selectedClassFunctionVariableTypeChanged"
      />
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.editor {
  background-color: $bgColor;
  color: $textColor;
  display: flex;
  align-items: stretch;
  align-content: stretch;
  flex-direction: column;
}

.top-bar {
  padding: $panelPadding;
  border-bottom: $borderColor solid 1px;
}

.main-area {
  display: flex;
  height: 100%;
  align-self: stretch;
}

.left-bar {
  flex-grow: 1;
  width: $panelWidth;
  max-width: $panelWidth;
  border-right: $borderColor solid 1px;
}

.paper-area {
  flex-grow: 10;
}

.right-bar {
  flex-grow: 1;
  width: $panelWidth;
  max-width: $panelWidth;
  border-left: $borderColor solid 1px;
  padding: $panelPadding;
}
</style>
