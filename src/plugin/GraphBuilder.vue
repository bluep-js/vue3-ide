<script>
import GraphNode from './GraphNode.vue'
import GraphEdge from './GraphEdge.vue'
import ContextMenu from './ContextMenu.vue'

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
      lastMouse: null,
      contextMenu: {
        show: false,
        filter: '',
        x: 0,
        y: 0
      },
      dragSlot: null
      /*
      selectedNode: null,
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

        this.graph.nodes[ncode].valid = nodeValid
      })
    },
    resizeUpdate () {
      // console.log('resize update', this.$refs.field)
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
        x: this.layout.parts[node.id].x + shift.x,
        y: this.layout.parts[node.id].y + shift.y
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
      if (!info) {
        this.dragSlot = null
        return
      }
      const from = this.slotPoint(info)
      const to = this.paperPoint()
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
      // TODO:
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
        this.graph.nodes[nodeFrom.id].templates[slotFrom.template].type = edgeType
      }

      if (slotTo.type === 'basic/template') {
        this.graph.nodes[nodeTo.id].templates[slotTo.template].type = edgeType
      }

      this.emitUpdate()
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
        const ins = Object.values(this.graph.nodes[edge.from.node].inputs).some(slot => slot.template === this.graph.nodes[edge.from.node].outputs[edge.from.slot].template && Object.keys(slot.connections || {}).length)
        const outs = Object.values(this.graph.nodes[edge.from.node].outputs).some(slot => slot.template === this.graph.nodes[edge.from.node].outputs[edge.from.slot].template && Object.keys(slot.connections || {}).length)
        if (!ins && !outs) {
          delete this.graph.nodes[edge.from.node].templates[this.graph.nodes[edge.from.node].outputs[edge.from.slot].template].type
        }
      }
      if (this.graph.nodes[edge.to.node].inputs[edge.to.slot].type === 'basic/template') {
        const ins = Object.values(this.graph.nodes[edge.to.node].inputs).some(slot => slot.template === this.graph.nodes[edge.to.node].inputs[edge.to.slot].template && Object.keys(slot.connections || {}).length)
        const outs = Object.values(this.graph.nodes[edge.to.node].outputs).some(slot => slot.template === this.graph.nodes[edge.to.node].inputs[edge.to.slot].template && Object.keys(slot.connections || {}).length)
        if (!ins && !outs) {
          delete this.graph.nodes[edge.to.node].templates[this.graph.nodes[edge.to.node].inputs[edge.to.slot].template].type
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
      delete this.layout[node.id]
      this.emitUpdate()
    },
    /*
    /**/
    mouseMove (e) {
      this.lastMouse = {
        x: e.pageX,
        y: e.pageY,
        cx: e.clientX,
        cy: e.clientY
      }
      if (this.dragField) {
        e.preventDefault()
        this.layout.field.top += e.movementY
        this.layout.field.left += e.movementX
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
        this.emitUpdate()
        // return
      }
      if (this.dragNode) {
        e.preventDefault()
        this.nodeDragged(this.dragNode, { x: e.movementX, y: e.movementY })
        this.emitUpdate()
      }
      if (this.dragSlot) {
        e.preventDefault()
        this.dragSlot.to = this.paperPoint(e)
        this.dragSlot.mid = this.midPoint(this.dragSlot.from, this.dragSlot.to)
      }
    },
    rightClick (e) {
      this.contextMenu.x = e.layerX
      this.contextMenu.y = e.layerY
      this.contextMenu.show = true
    },
    mouseDown (e) {
      // only left mouse down
      if (e.buttons === 1) {
        if (e.path[0].nodeName === 'svg' && e.path[0].className.baseVal === 'field-svg') {
          this.contextMenu.show = false
          this.contextMenu.filter = ''
          this.dragField = true
        }
      }
    },
    mouseUp () {
      this.dragField = false
      this.dragNode = null
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
    emitUpdate () {
      const next = { ...this.modelValue }
      next.graph = this.graph
      next.layout = this.layout
      this.$emit('update:modelValue', next)
    },
    typeColor (tp) {
      // :stroke="types[dragSlot.type].color"
      let ftp = null
      Object.keys(this.types).forEach(ttp => {
        if (tp.startsWith(ttp)) {
          ftp = ttp
        }
      })
      return ftp ? this.types[ftp].color : '#999'
    }
  },
  computed: {
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
    }
  }
}
</script>

<template>
<div class="wrapper">
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
        height: layout.field.height + 'px'
      }"
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
        <path
          v-if="dragSlot"
          :d="slotDragPath"
          :stroke="typeColor(dragSlot.type)"
          :stroke-width="2"
          fill="transparent"
        />
        <GraphEdge
          v-for="edge of Object.values(graph.edges)"
          :key="edge.id"
          :edge="edge"
          :layout="layout"
          :types="types"
        />
        <!--
        @dragged="nodeDragged(nd, $event)"
        :fn="modelValue"
        -->
      </svg>
      <GraphNode
        v-for="nd of Object.values(graph.nodes)"
        :key="nd.id"
        v-model="graph.nodes[nd.id]"
        :types="types"
        :libraries="libraries"
        :currentLibrary="currentLibrary"
        :layout="layout.parts[nd.id]"
        :dragSlot="dragSlot"
        :icons="icons"
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