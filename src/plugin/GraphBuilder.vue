<script>
import GraphNode from './GraphNode.vue'
import GraphEdge from './GraphEdge.vue'
import ContextMenu from './ContextMenu.vue'

import { slotTemplateKeys } from './graph.js'
import { jclone } from './utils.js'

export default {
  name: 'GraphBuilder',
  components: {
    GraphNode,
    ContextMenu,
    GraphEdge
  },
  props: [
    'modelValue',
    'nodes',
    'types',
    'icons',
    'libraries',
    'modules',
    'currentLibrary'
  ],
  emits: [
    'update:modelValue',
    'reset',
    'resize'
  ],
  data () {
    return {
      graph: this.modelValue?.graph || {},
      layout: this.modelValue?.layout || {},
      mouseHold: false,
      dragField: false,
      dragNode: null,
      lastMouse: {
        x: 0,
        y: 0,
        cx: 0,
        cy: 0,
        lx: 0,
        ly: 0,
        ox: 0,
        oy: 0,
        delta: {
          x: 0,
          y: 0
        },
        paperX: 0,
        paperY: 0
      },
      contextMenu: {
        show: false,
        filter: '',
        x: 0,
        y: 0
      },
      snapToGrid: false,
      dragSlot: null,
      selectedNodes: [],
      selectorRect: null,
      tool: 'cursor'
      /*
      selectedEdge: null,
      */
    }
  },
  mounted () {
    this.resizeUpdate()
    window.addEventListener('resize', this.resizeUpdate)
  },
  created () {
    this.validate()
  },
  beforeUnmount () {
    window.removeEventListener('resize', this.resizeUpdate)
  },
  watch: {
    modelValue: {
      handler (next, prev) {
        this.graph = next.graph
        this.layout = next.layout
        if (!prev || (next && prev && next.code !== prev.code)) this.validate()
      },
      deep: true
    }
  },
  methods: {
    validate () {
      if (!this.modelValue) return
      // console.log('validate', this.modelValue)
      Object.keys(this.graph.nodes).forEach(ncode => {
        let nodeValid = true

        // call node
        if (ncode.startsWith('graph/call')) {
          Object.keys(this.modelValue.context.inputs).forEach(fcode => {
            const inp = this.modelValue.context.inputs[fcode]
            if (!this.graph.nodes[ncode].outputs[fcode]) {
              this.graph.nodes[ncode].outputs[fcode] = jclone(inp)
            } else {
              const out = this.graph.nodes[ncode].outputs[fcode]
              if ((out.type !== inp.type || out.isArray !== inp.isArray) && Object.keys(out.connections || {}).length) nodeValid = false
              this.graph.nodes[ncode].outputs[fcode].name = inp.name
              this.graph.nodes[ncode].outputs[fcode].type = inp.type
              this.graph.nodes[ncode].outputs[fcode].isArray = inp.isArray
            }
          })
          // removed inputs
          Object.keys(this.graph.nodes[ncode].outputs).forEach(fcode => {
            if (fcode === 'call') return
            if (!this.modelValue.context.inputs[fcode]) {
              if (Object.keys(this.graph.nodes[ncode].outputs[fcode].connections || {}).length) {
                nodeValid = false
              } else {
                delete this.graph.nodes[ncode].outputs[fcode]
              }
            }
          })
        }

        // return nodes
        if (ncode.startsWith('graph/return')) {
          Object.keys(this.modelValue.context.outputs).forEach(fcode => {
            const out = this.modelValue.context.outputs[fcode]
            if (!this.graph.nodes[ncode].inputs[fcode]) {
              this.graph.nodes[ncode].inputs[fcode] = jclone(out)
            } else {
              const inp = this.graph.nodes[ncode].inputs[fcode]
              if ((out.type !== inp.type || out.isArray !== inp.isArray) && Object.keys(inp.connections || {}).length) nodeValid = false
              this.graph.nodes[ncode].inputs[fcode].name = out.name
              this.graph.nodes[ncode].inputs[fcode].type = out.type
              this.graph.nodes[ncode].inputs[fcode].isArray = out.isArray
            }
          })
          // removed outputs
          Object.keys(this.graph.nodes[ncode].inputs).forEach(fcode => {
            if (fcode === 'call') return
            if (!this.modelValue.context.outputs[fcode]) {
              if (Object.keys(this.graph.nodes[ncode].inputs[fcode].connections || {}).length) {
                nodeValid = false
              } else {
                delete this.graph.nodes[ncode].inputs[fcode]
              }
            }
          })
        }

        // function nodes
        if (ncode.startsWith('graph/function')) {
          const ndata = this.graph.nodes[ncode].data
          if (!this.libraries[ndata.library] || !this.libraries[ndata.library].functions || !this.libraries[ndata.library].functions[ndata.fid]) {
            nodeValid = false
          } else {
            const src = this.libraries[ndata.library].functions[ndata.fid]
            // inputs
            Object.keys(src.context.inputs).forEach(fcode => {
              const inp = src.context.inputs[fcode]
              if (!this.graph.nodes[ncode].inputs[fcode]) {
                this.graph.nodes[ncode].inputs[fcode] = jclone(inp)
              } else {
                const out = this.graph.nodes[ncode].inputs[fcode]
                if ((out.type !== inp.type || out.isArray !== inp.isArray) && Object.keys(out.connections || {}).length) nodeValid = false
                this.graph.nodes[ncode].inputs[fcode].name = inp.name
                this.graph.nodes[ncode].inputs[fcode].type = inp.type
                this.graph.nodes[ncode].inputs[fcode].isArray = inp.isArray
              }
            })
            // removed inputs
            Object.keys(this.graph.nodes[ncode].inputs).forEach(fcode => {
              if (fcode === 'call') return
              if (!src.context.inputs[fcode]) {
                if (Object.keys(this.graph.nodes[ncode].inputs[fcode].connections || {}).length) {
                  nodeValid = false
                } else {
                  delete this.graph.nodes[ncode].inputs[fcode]
                }
              }
            })
            // outputs
            Object.keys(src.context.outputs).forEach(fcode => {
              const out = src.context.outputs[fcode]
              if (!this.graph.nodes[ncode].outputs[fcode]) {
                this.graph.nodes[ncode].outputs[fcode] = jclone(out)
              } else {
                const inp = this.graph.nodes[ncode].outputs[fcode]
                if ((out.type !== inp.type || out.isArray !== inp.isArray) && Object.keys(inp.connections || {}).length) nodeValid = false
                this.graph.nodes[ncode].outputs[fcode].name = out.name
                this.graph.nodes[ncode].outputs[fcode].type = out.type
                this.graph.nodes[ncode].outputs[fcode].isArray = out.isArray
              }
            })
            // removed outputs
            Object.keys(this.graph.nodes[ncode].outputs).forEach(fcode => {
              if (fcode === 'return') return
              if (!src.context.outputs[fcode]) {
                if (Object.keys(this.graph.nodes[ncode].outputs[fcode].connections || {}).length) {
                  nodeValid = false
                } else {
                  delete this.graph.nodes[ncode].outputs[fcode]
                }
              }
            })
          }
        }

        // TODO
        // variable nodes
        // new nodes
        // methods nodes
        // constructor nodes
        // classes variables/props getters/setters
        // actors nodes

        this.graph.nodes[ncode].valid = nodeValid
      })
    },
    resizeUpdate () {
      // console.log('resize update', this.$refs.field)
    },
    clipboardAction (action) {
      console.log('clipboard action', action)
    },
    setDragNode (node, state) {
      this.dragNode = state ? node : null
    },
    paperPoint () {
      if (!this.$refs.paper) {
        return {
          x: 0,
          y: 0
        }
      }
      const rect = this.$refs.paper.getBoundingClientRect()
      return {
        x: this.lastMouse.cx - this.layout.field.left - rect.left,
        y: this.lastMouse.cy - this.layout.field.top - rect.top
      }
    },
    slotPoint ({ node, shift }) {
      const pos = {
        x: Math.round(this.layout.parts[node.id].x + Math.round(shift.x / this.layout.zoom.current)),
        y: Math.round(this.layout.parts[node.id].y + Math.round(shift.y / this.layout.zoom.current))
      }
      return pos
    },
    midPoint (a, b) {
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
      }
    },
    addNode (code, atContext = false) {
      const now = new Date()
      const part = this.nodes.find(x => x.code === code)
      if (!part) return
      const node = JSON.parse(JSON.stringify(part))
      // if (typeof node.data === 'undefined') node.data = {}
      node.id = `${node.code}_${now.getTime()}`
      if (node.code === 'graph/return') {
        Object.keys(this.modelValue.context.outputs).forEach(key => {
          node.inputs[key] = JSON.parse(JSON.stringify(this.modelValue.context.outputs[key]))
        })
      }
      const nodeLayout = atContext ? {
        x: this.contextMenu.x,
        y: this.contextMenu.y
      } : {
        x: -this.layout.field.left + 15,
        y: -this.layout.field.top + 15
      }
      this.layout.parts[node.id] = nodeLayout
      this.graph.nodes[node.id] = node
      this.emitUpdate()
    },
    nodeDragged (node, shift) {
      if (!node) return
      this.layout.parts[node.id].x += shift.x
      this.layout.parts[node.id].y += shift.y
      Object.values(node.inputs || {}).forEach(slot => {
        Object.keys(slot.connections || {}).forEach(eid => {
          this.layout.parts[eid].to.x += shift.x
          this.layout.parts[eid].to.y += shift.y
        })
      })
      Object.values(node.outputs || {}).forEach(slot => {
        Object.keys(slot.connections || {}).forEach(eid => {
          this.layout.parts[eid].from.x += shift.x
          this.layout.parts[eid].from.y += shift.y
        })
      })
      this.emitUpdate()
    },
    slotDrag (info) {
      if (!info || this.tool !== 'cursor') {
        this.dragSlot = null
        return
      }
      const from = this.slotPoint(info)
      const to = { x: this.lastMouse.paperX, y: this.lastMouse.paperY }
      const mid = this.midPoint(from, to)
      this.dragSlot = { ...info, from, to, mid }
    },
    slotDropped (info) {
      const dropPoint = this.slotPoint(info)
      const nodeFrom = info.slot.direction === 'inputs' ? this.dragSlot.node : info.node
      const nodeTo = info.slot.direction === 'inputs' ? info.node : this.dragSlot.node
      const slotFrom = info.slot.direction === 'inputs' ? this.dragSlot.slot : info.slot
      const slotTo = info.slot.direction === 'inputs' ? info.slot : this.dragSlot.slot
      const pointFrom = info.slot.direction === 'inputs' ? this.dragSlot.from : dropPoint
      const pointTo = info.slot.direction === 'inputs' ? dropPoint : this.dragSlot.from
      const edgeType = slotFrom.type === 'basic/template' ? slotTo.type : slotFrom.type
      const now = new Date()
      if (slotTo.isArray) {
        // console.log('TO ARRAY', slotTo)
        pointFrom.y += 2
        pointTo.y += 2
      }
      const edge = {
        id: `edge_${now.getTime()}`,
        type: edgeType,
        from: {
          node: nodeFrom.id,
          slot: slotFrom.code
        },
        to: {
          node: nodeTo.id,
          slot: slotTo.code
        }
      }
      const edgeLayout = {
        from: { ...pointFrom },
        to: { ...pointTo }
      }
      // let's check if there are already edges for this slot
      // input slot may have multiple connections only if it is basic/execute type
      // output slot may have multiple connections only if it is not basic/execute type

      if (slotFrom.type === 'basic/execute' && slotFrom.connections) Object.keys(slotFrom.connections).forEach(eid => this.deleteEdge(eid))
      if (slotTo.type !== 'basic/execute' && slotTo.connections) Object.keys(slotTo.connections).forEach(eid => this.deleteEdge(eid))

      this.graph.edges[edge.id] = edge
      this.layout.parts[edge.id] = edgeLayout

      if (!this.graph.nodes[nodeFrom.id].outputs[slotFrom.code].connections) this.graph.nodes[nodeFrom.id].outputs[slotFrom.code].connections = {}
      this.graph.nodes[nodeFrom.id].outputs[slotFrom.code].connections[edge.id] = edge

      if (!this.graph.nodes[nodeTo.id].inputs[slotTo.code].connections) this.graph.nodes[nodeTo.id].inputs[slotTo.code].connections = {}
      this.graph.nodes[nodeTo.id].inputs[slotTo.code].connections[edge.id] = edge

      if (slotFrom.type === 'basic/template') {
        this.slotSetTemplatedType(nodeFrom.id, 'outputs', slotFrom.code, slotTo)
      }

      if (slotTo.type === 'basic/template') {
        this.slotSetTemplatedType(nodeTo.id, 'inputs', slotTo.code, slotFrom)
      }

      this.emitUpdate()
    },

    /* set templated slot type */
    slotSetTemplatedType (nid, slotDirection, slotCode, dropSlot) {
      const node = this.graph.nodes[nid]
      if (!node) return
      const slot = node[slotDirection][slotCode]
      if (!slot || slot.type !== 'basic/template') return
      const tpl = slotTemplateKeys(node, slot)
      if (!tpl || !tpl.tkey || !node.templates[tpl.tkey]) return
      const next = {
        type: dropSlot.type,
        isArray: dropSlot.isArray,
        canBeArray: dropSlot.canBeArray
      }
      this.graph.nodes[nid].templates[tpl.tkey].value = next
      if (!tpl.vkey || !node.templates[tpl.tkey].variants) return
      const variant = node.templates[tpl.tkey].variants[tpl.vkey]
      if (!variant) return
      Object.keys(variant.info || {}).forEach(ikey => {
        next[ikey] = variant.info[ikey]
      })
      Object.keys(variant.$add || {}).forEach(ikey => {
        next[ikey] -= variant.$add[ikey]
      })
      this.graph.nodes[nid].templates[tpl.tkey].value = next
    },

    /* slot clear */
    slotClear ({ node, slot }) {
      Object.keys(this.graph.nodes[node.id][slot.direction][slot.code].connections).forEach(eid => this.deleteEdge(eid))
    },

    /* slot shifted */
    slotShifted (info) {
      // console.log('slot shifted', info)
      Object.keys(info.slot.connections || {}).forEach(eid => {
        const key = info.slot.direction === 'inputs' ? 'to' : 'from'
        const epoint = this.layout.parts[eid][key]
        const npoint = this.slotPoint(info)
        if (epoint.x === npoint.x && epoint.y === npoint.y) return
        this.layout.parts[eid][key].x = npoint.x
        this.layout.parts[eid][key].y = npoint.y
        // console.log('SHIFTED ', info.slot.code, epoint, npoint)
      })
    },

    /* delete edge */
    deleteEdge (eid) {
      const edge = this.graph.edges[eid]
      if (!edge) return
      if (this.graph.nodes[edge.from.node].outputs[edge.from.slot].connections) delete this.graph.nodes[edge.from.node].outputs[edge.from.slot].connections[eid]
      if (this.graph.nodes[edge.to.node].inputs[edge.to.slot].connections) delete this.graph.nodes[edge.to.node].inputs[edge.to.slot].connections[eid]
      if (this.graph.nodes[edge.from.node].outputs[edge.from.slot].type === 'basic/template') {
        const keys = slotTemplateKeys(this.graph.nodes[edge.from.node], this.graph.nodes[edge.from.node].outputs[edge.from.slot])
        const ins = Object.values(this.graph.nodes[edge.from.node].inputs).some(slot => (slot.template || '').startsWith(keys.tkey) && Object.keys(slot.connections || {}).length)
        const outs = Object.values(this.graph.nodes[edge.from.node].outputs).some(slot => (slot.template || '').startsWith(keys.tkey) && Object.keys(slot.connections || {}).length)
        if (!ins && !outs) {
          if (keys.tkey) delete this.graph.nodes[edge.from.node].templates[keys.tkey].value
        }
      }
      if (this.graph.nodes[edge.to.node].inputs[edge.to.slot].type === 'basic/template') {
        const keys = slotTemplateKeys(this.graph.nodes[edge.to.node], this.graph.nodes[edge.to.node].inputs[edge.to.slot])
        const ins = Object.values(this.graph.nodes[edge.to.node].inputs).some(slot => (slot.template || '').startsWith(keys.tkey) && Object.keys(slot.connections || {}).length)
        const outs = Object.values(this.graph.nodes[edge.to.node].outputs).some(slot => (slot.template || '').startsWith(keys.tkey) && Object.keys(slot.connections || {}).length)
        if (!ins && !outs) {
          if (keys.tkey) delete this.graph.nodes[edge.to.node].templates[keys.tkey].value
        }
      }
      delete this.layout.parts[eid]
      delete this.graph.edges[eid]
      this.validate()
      this.emitUpdate()
    },

    deleteNode (node) {
      // console.log('del node', node)
      Object.values(node.inputs || {}).forEach(slot => {
        Object.keys(slot.connections || {}).forEach(eid => this.deleteEdge(eid))
      })
      Object.values(node.outputs || {}).forEach(slot => {
        Object.keys(slot.connections || {}).forEach(eid => this.deleteEdge(eid))
      })

      delete this.graph.nodes[node.id]
      delete this.layout.parts[node.id]
      this.emitUpdate()
    },
    /**/
    updateLastMouse (e) {
      const delta = {
        x: -this.lastMouse.cx + e.clientX,
        y: -this.lastMouse.cy + e.clientY
      }
      this.lastMouse.x = e.pageX
      this.lastMouse.y = e.pageY
      this.lastMouse.cx = e.clientX
      this.lastMouse.cy = e.clientY
      this.lastMouse.ox = e.offsetX
      this.lastMouse.oy = e.offsetY
      this.lastMouse.lx = e.layerX
      this.lastMouse.ly = e.layerY
      this.lastMouse.delta = delta
      this.lastMouse.buttons = e.buttons
      if (this.isFieldEvent(e)) {
        this.lastMouse.paperX = this.lastMouse.ox
        this.lastMouse.paperY = this.lastMouse.oy
      } else {
        this.lastMouse.paperX += delta.x
        this.lastMouse.paperY += delta.y
      }
    },
    isFieldEvent (e) {
      const target = e.path
        ? e.path[0]
        : e.target
      return target.nodeName === 'svg' && target.className.baseVal === 'field-svg'
    },
    movePaper (shift) {
      // const dt = this.graphTop - this.layout.field.top
      // const dl = this.layout.field.left - this.graphLeft
      // console.log(dt)
      // if (shift.y < 0 && dt > 1000) this.layout.field.top += shift.y
      // const db = this.layout.field.height - this.graphBottom
      // if (shift.y > 0 && db > 1000) this.layout.field.top += shift.y
      this.layout.field.left += shift.x
      this.layout.field.top += shift.y
      if (this.layout.field.top > -50) {
        this.layout.field.top -= 500
        this.layout.field.height += 500
        Object.keys(this.layout.parts).forEach(pid => {
          if (pid.startsWith('edge')) {
            this.layout.parts[pid].to.y += 500
            this.layout.parts[pid].from.y += 500
          } else {
            this.layout.parts[pid].y += 500
          }
        })
      }
      if (this.layout.field.left > -50) {
        this.layout.field.left -= 500
        this.layout.field.width += 500
        Object.keys(this.layout.parts).forEach(pid => {
          if (pid.startsWith('edge')) {
            this.layout.parts[pid].to.x += 500
            this.layout.parts[pid].from.x += 500
          } else {
            this.layout.parts[pid].x += 500
          }
        })
      }
      const paperRect = this.$refs.paper.getBoundingClientRect()
      if (this.layout.field.width + this.layout.field.left < paperRect.width - 100) {
        this.layout.field.width += 500
      }
      if (this.layout.field.height + this.layout.field.top < paperRect.height - 100) {
        this.layout.field.height += 500
      }
    },
    /**/
    mouseMove (e) {
      this.updateLastMouse(e)
      // field drag
      if (this.dragField) {
        e.preventDefault()
        this.movePaper(this.lastMouse.delta)
        this.emitUpdate()
        return
      }
      // node drag
      if (this.dragNode) {
        e.preventDefault()
        const dz = {
          x: Math.round(this.lastMouse.delta.x / this.layout.zoom.current),
          y: Math.round(this.lastMouse.delta.y / this.layout.zoom.current)
        }
        /*
        if (this.snapToGrid) {
          dz.x = Math.round(dz.x / 10) * 10
          dz.y = Math.round(dz.y / 10) * 10
        }
        */
        if (this.selectedNodes.length) {
          this.selectedNodes.forEach(nid => {
            this.nodeDragged(this.graph.nodes[nid], dz)
          })
        } else {
          this.nodeDragged(this.dragNode, dz)
        }
        this.emitUpdate()
      }
      if (this.dragSlot) {
        e.preventDefault()
        this.dragSlot.to = { x: this.lastMouse.paperX, y: this.lastMouse.paperY }
        this.dragSlot.mid = this.midPoint(this.dragSlot.from, this.dragSlot.to)
      }
      // selector rect
      if (this.selectorRect) {
        e.preventDefault()
        this.selectorRect.toX = this.lastMouse.paperX
        this.selectorRect.toY = this.lastMouse.paperY
        const selection = []
        Object.keys(this.layout.parts).forEach(pid => {
          if (pid.startsWith('edge_')) return
          const p = this.layout.parts[pid]
          const r = this.selectorRectSvg
          if (p.x >= r.x && p.x <= r.x + r.w && p.y >= r.y && p.y <= r.y + r.h) selection.push(pid)
        })
        this.selectedNodes = [...selection]
      }
    },
    rightClick (e) {
      this.updateLastMouse(e)
      this.selectedNodes = []
      this.contextMenu.x = this.lastMouse.paperX
      this.contextMenu.y = this.lastMouse.paperY
      this.contextMenu.show = true
    },
    mouseDown (e) {
      this.updateLastMouse(e)
      // only left mouse down
      if (e.buttons === 1) {
        if (this.isFieldEvent(e)) {
          // selectorRect
          this.contextMenu.show = false
          this.contextMenu.filter = ''
          // cursor tool or ALT key
          if (this.tool === 'cursor' || e.altKey) {
            this.dragField = true
            return
          }
          if (this.tool === 'select') {
            this.selectedNodes = []
            if (!this.selectorRect) {
              this.selectorRect = {
                fromX: this.lastMouse.paperX,
                fromY: this.lastMouse.paperY,
                toX: this.lastMouse.paperX,
                toY: this.lastMouse.paperY
              }
            }
          }
        }
      }
      // middle mouse down in any mode
      if (e.buttons === 4) {
        // field drag on middle mouse
        if (this.isFieldEvent(e)) {
          this.contextMenu.show = false
          this.contextMenu.filter = ''
          this.dragField = true
        }
      }
    },
    mouseUp () {
      this.dragField = false
      this.dragNode = null
      this.selectorRect = null
      /*
      if (this.dragSlot) {
        this.contextMenu.filter = this.dragSlot.type + ''
        this.contextMenu.x = e.layerX
        this.contextMenu.x = e.layerX
        this.contextMenu.y = e.layerY
        this.contextMenu.show = true
      }
      */
      this.dragSlot = null
    },
    mouseWheel (e) {
      /**/
      // console.log(e)
      // this.updateLastMouse(e)
      if (this.layout.zoom.step !== 0.1) this.layout.zoom.step = 0.1
      if (this.layout.zoom.min !== 0.5) this.layout.zoom.min = 0.5
      if (this.layout.zoom.max !== 2.0) this.layout.zoom.max = 2.0

      const ok = this.zoomAction(e.deltaY > 0 ? 'in' : 'out', false)
      if (!ok) return

      const paperRect = this.$refs.paper.getBoundingClientRect()
      const px = e.clientX - paperRect.left
      const py = e.clientY - paperRect.top
      if (px < 0 || px > paperRect.width) return
      if (py < 0 || py > paperRect.height) return
      const dx = (paperRect.width / 2 - px) / 4
      const dy = (paperRect.height / 2 - py) / 4

      if (e.deltaY > 0) this.movePaper({ x: -dx, y: -dy })
      else this.movePaper({ x: dx, y: dy })
      this.emitUpdate()
    },
    zoomAction (action, emitUpdate = true) {
      const dir = action === 'in' ? 1 : -1
      const step = this.layout.zoom.step * dir
      const next = this.round(this.layout.zoom.current - step, 1)
      if (next >= this.layout.zoom.min && next <= this.layout.zoom.max) {
        this.layout.zoom.current = next
        if (emitUpdate) this.emitUpdate()
        return true
      }
      return false
    },
    onMouseEdgeEnter (eid) {
      if (this.tool === 'eraser' && this.lastMouse.buttons === 1) {
        this.deleteEdge(eid)
      }
    },
    emitUpdate () {
      const next = { ...this.modelValue }
      next.graph = this.graph
      next.layout = this.layout
      this.$emit('update:modelValue', next)
    },
    typeColor (tp) {
      const grey = '#999'
      let ftp = null
      Object.keys(this.types).forEach(ttp => {
        if (tp.startsWith(ttp)) {
          ftp = ttp
        }
      })
      return ftp ? this.types[ftp].color : grey
    },
    round (num, digits = 4) {
      if (typeof num !== 'number') return 0
      const d = Math.pow(10, digits)
      return Math.round(num * d) / d
    }
  },
  computed: {
    hasClipboard () {
      return false
    },
    graphTop () {
      return Object.values(this.layout.parts).reduce((acc, el) => {
        if (!el.y) return acc
        if (typeof acc === 'undefined') return el.y
        return Math.min(acc, el.y)
      }, undefined)
    },
    graphBottom () {
      return Object.values(this.layout.parts).reduce((acc, el) => {
        if (!el.y) return acc
        if (typeof acc === 'undefined') return el.y
        return Math.max(acc, el.y)
      }, undefined)
    },
    graphLeft () {
      return Object.values(this.layout.parts).reduce((acc, el) => {
        if (!el.x) return acc
        if (typeof acc === 'undefined') return el.x
        return Math.min(acc, el.x)
      }, undefined)
    },
    graphRight () {
      return Object.values(this.layout.parts).reduce((acc, el) => {
        if (!el.x) return acc
        if (typeof acc === 'undefined') return el.x
        return Math.max(acc, el.x)
      }, undefined)
    },
    nodesList () {
      return Object.values(this.nodes)
    },
    slotDragPath () {
      let path = 'M ' + this.dragSlot.from.x + ' ' + this.dragSlot.from.y
      path += 'C ' + this.dragSlot.from.x + ' ' + this.dragSlot.from.y
      if (this.dragSlot.slot.direction === 'inputs') {
        path += ', ' + (this.dragSlot.from.x - 20) + ' ' + this.dragSlot.from.y
      } else {
        path += ', ' + (this.dragSlot.from.x + 20) + ' ' + this.dragSlot.from.y
      }
      const mid = this.midPoint(this.dragSlot.from, this.dragSlot.to)
      path += ', ' + mid.x + ' ' + mid.y
      if (this.dragSlot.slot.direction === 'inputs') {
        path += 'S ' + (this.dragSlot.to.x + 10) + ' ' + this.dragSlot.to.y
      } else {
        path += 'S ' + (this.dragSlot.to.x - 10) + ' ' + this.dragSlot.to.y
      }
      path += ', ' + this.dragSlot.to.x + ' ' + this.dragSlot.to.y
      return path
    },
    fieldWidth () {
      return this.layout.field.width - this.layout.field.left
    },
    fieldHeight () {
      return this.layout.field.height - this.layout.field.top
    },
    gridLines () {
      const vertical = []
      for (let i = 0; i < this.fieldWidth; i += 25) {
        vertical.push(i)
      }
      const horizontal = []
      for (let i = 0; i < this.fieldHeight; i += 25) {
        horizontal.push(i)
      }
      return { vertical, horizontal }
    },
    zoom () {
      return Math.floor(this.layout.zoom.current * 100) + '%'
    },
    selectorRectSvg () {
      const ret = {
        x: 0,
        y: 0,
        w: 0,
        h: 0
      }
      if (!this.selectorRect) return ret
      if (this.selectorRect.fromX < this.selectorRect.toX) {
        ret.x = this.selectorRect.fromX
        ret.w = this.selectorRect.toX - this.selectorRect.fromX
      } else {
        ret.x = this.selectorRect.toX
        ret.w = this.selectorRect.fromX - this.selectorRect.toX
      }
      if (this.selectorRect.fromY < this.selectorRect.toY) {
        ret.y = this.selectorRect.fromY
        ret.h = this.selectorRect.toY - this.selectorRect.fromY
      } else {
        ret.y = this.selectorRect.toY
        ret.h = this.selectorRect.fromY - this.selectorRect.toY
      }
      return ret
    }
  }
}
</script>

<template>
<div class="wrapper" :class="{'wrapper-dnd': (!!dragField || !!dragNode) }">
  <div class="tools">
    <!--
    <div class="coords">
      X: {{lastMouse.paperX}} Y: {{lastMouse.paperY}}
    </div>
    -->
    <div class="tools-group">
      <button @click="tool = 'cursor'" class="icon-button" :class="{ active: tool === 'cursor' }" title="Cursor">
        <i :class="icons.toolArrow + ' ' + icons.fw" />
      </button>
      <button @click="tool = 'select'" class="icon-button" :class="{ active: tool === 'select' }" title="Select">
        <i :class="icons.toolSelectBox + ' ' + icons.fw" />
      </button>
      <button @click="tool = 'eraser'" class="icon-button" :class="{ active: tool === 'eraser' }" title="Erase edges">
        <i :class="icons.toolEraser + ' ' + icons.fw" />
      </button>
    </div>
    <!--
    <div class="tools-group">
      <button @click="clipboardAction('copy')" class="icon-button" :disabled="!selectedNodes.length" title="Copy to clipboard">
        <i :class="icons.clipboardCopy + ' ' + icons.fw" />
      </button>
      <button @click="clipboardAction('cut')" class="icon-button"  :disabled="!selectedNodes.length" title="Cut to clipboard">
        <i :class="icons.clipboardCut + ' ' + icons.fw" />
      </button>
      <button @click="clipboardAction('paste')" class="icon-button"  :disabled="!hasClipboard" title="Paste from clipboard">
        <i :class="icons.clipboardPaste + ' ' + icons.fw" />
      </button>
    </div>
    -->
    <div class="tools-group">
      <button @click="zoomAction('out')" class="icon-button" :disabled="layout.zoom.current >= layout.zoom.max" title="Zoom in">
        <i :class="icons.zoomIn + ' ' + icons.fw" />
      </button>
      <div class="zoom">{{zoom}}</div>
      <button @click="zoomAction('in')" class="icon-button" :disabled="layout.zoom.current <= layout.zoom.min" title="Zoom out">
        <i :class="icons.zoomOut + ' ' + icons.fw" />
      </button>
    </div>
    <!--
    <div class="tools-group">
      <button @click="snapToGrid = !snapToGrid" class="icon-button" :class="{ active: snapToGrid }" title="Snap to grid">
        <i :class="icons.snapToGrid + ' ' + icons.fw" />
      </button>
    </div>
    -->
  </div>
  <div
    ref="paper"
    class="paper"
  >
    <div
      ref="field"
      class="field"
      :style="{
        position: 'absolute',
        top: layout.field.top + 'px',
        left: layout.field.left + 'px',
        width: layout.field.width + 'px',
        height: layout.field.height + 'px',
        transform: `scale(${layout.zoom.current}, ${layout.zoom.current})`,
      }"
      @wheel="mouseWheel"
      @mousemove="mouseMove"
      @mousedown="mouseDown"
      @mouseup="mouseUp"
      @contextmenu.prevent.stop="rightClick"
    >
      <ContextMenu
        v-if="contextMenu.show"
        :graph="graph"
        :types="types"
        :nodes="nodes"
        :filter="contextMenu.filter"
        :posX="contextMenu.x"
        :posY="contextMenu.y"
        @addNode="addNode($event, true), contextMenu.show = false, contextMenu.filter = ''"
      />
      <svg
        ref="svg"
        :width="layout.field.width"
        :height="layout.field.height"
        class="field-svg"
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <!-- grid -->
        <line
          v-for="l of gridLines.vertical"
          :key="l"
          class="grid-line"
          :x1="l"
          :y1="0"
          :x2="l"
          :y2="fieldHeight"
        />
        <line
          v-for="l of gridLines.horizontal"
          :key="l"
          class="grid-line"
          :x1="0"
          :y1="l"
          :x2="fieldWidth"
          :y2="l"
        />
        <!-- drag slot -->
        <path
          v-if="dragSlot"
          :d="slotDragPath"
          :stroke="typeColor(dragSlot.type)"
          :stroke-width="2"
          fill="transparent"
        />
        <!-- selector rect -->
        <rect
          v-if="selectorRect"
          :x="selectorRectSvg.x"
          :y="selectorRectSvg.y"
          :width="selectorRectSvg.w"
          :height="selectorRectSvg.h"
          stroke="yellow"
          stroke-width="1"
          stroke-dasharray="10,10,5,5,5,10"
          fill="rgba(255,255,255,0.1)"
        />
        <!-- edges -->
        <GraphEdge
          v-for="edge of Object.values(graph.edges)"
          :key="edge.id"
          :edge="edge"
          :layout="layout"
          :types="types"
          :dragSlot="dragSlot"
          @mouseEnter="onMouseEdgeEnter(edge.id)"
        />
      </svg>
      <GraphNode
        v-for="nd of Object.values(graph.nodes)"
        :key="nd.id"
        v-model="graph.nodes[nd.id]"
        :types="types"
        :libraries="libraries"
        :modules="modules"
        :currentLibrary="currentLibrary"
        :layout="layout.parts[nd.id]"
        :dragSlot="dragSlot"
        :icons="icons"
        :selected="selectedNodes.includes(nd.id)"
        @draggable="setDragNode(nd, $event)"
        @slotDraggable="slotDrag"
        @slotDropped="slotDropped"
        @slotClear="slotClear"
        @slotShifted="slotShifted"
        @deleteMe="deleteNode(nd)"
        @update:modelValue="emitUpdate"
      />
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.wrapper {
  height: 100%;
  position: relative;

  &.wrapper-dnd {
    cursor: move;
  }
}

.tools {
  position: absolute;
  top: 10px;
  right: 30px;
  display: flex;
  justify-content: stretch;
  z-index: 3;

  .tools-group {
    border: 1px solid $borderColor;
    padding: 4px;
    border-radius: 4px;
    margin-left: 4px;
    display: flex;
    z-index: 4;

    .zoom {
      display: flex;
      flex-direction: column;
      justify-content: center;
      padding-left: 8px;
      padding-right: 8px;
    }

    button.icon-button {
      z-index: 5;

      &.active {
        color: #0bf113;
      }
    }
  }

  > div {
    padding-right: 10px;

    &:last-child {
      padding-right: 0;
    }
  }

  &::after {
    content: '';
    background: #fff;
    opacity: 0.1;
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }
}

.paper
{
  position: relative;
  width: 100%;
  height: 100%;
  // background: $bgColor;
  // border: 1px solid $borderColor;
  overflow: hidden;
  z-index: 1;

  .field
  {
    position: absolute;
    z-index: 2;
  }
}

line.grid-line {
  stroke: $paperGridColor;
  stroke-width: 0.5;
}

</style>
