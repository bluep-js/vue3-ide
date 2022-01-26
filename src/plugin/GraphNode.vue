<script>
import { classCombined } from './graph.js'
import { jclone, waitFor } from './utils.js'
// import { defineAsyncComponent } from 'vue'

// import ExecuteNode from './nodes/Execute'
import GraphNodeSlot from './GraphNodeSlot.vue'

export default {
  name: 'GraphNode',
  components: {
    GraphNodeSlot
  },
  props: [
    'libraries',
    'modules',
    'currentLibrary',
    'selected',
    'modelValue',
    'types',
    'layout',
    'icons',
    'dragSlot'
  ],
  emits: [
    'update:modelValue',
    'draggable',
    'slotDraggable',
    'slotDropped',
    'slotClear',
    'slotShifted',
    'deleteMe'
  ],
  data () {
    // const rect = this.$refs.node.getBoundingRect()
    // console.log(rect)
    return {
      node: this.modelValue,
      highlighted: false,
      boundingRect: null // rect
    }
  },
  async created () {
    await waitFor(0)
    if (this.$refs.graphNode) {
      const ro = new ResizeObserver(this.resizeUpdate)
      ro.observe(this.$refs.graphNode)
    }
  },
  watch: {
    'node.inputs.of': {
      deep: true,
      handler (next) {
        // console.log('next of', next, this.node)
        if (!next || this.node.code !== 'class/new' || next.type !== 'bluep/classselector') return
        // if (next && prev && next.value === prev.value) return
        Object.keys(this.node.inputs).forEach(incode => {
          if (incode === 'call' || incode === 'of') return
          if (Object.keys(this.node.inputs[incode].connections || {}).length) {
            this.$emit('slotClear', {
              node: this.node,
              slot: {
                direction: 'inputs',
                code: incode
              }
            })
          }
          delete this.node.inputs[incode]
        })
        const codes = (next.value || '').split('/')
        if (codes.length >= 3) {
          const cls = classCombined(codes[2], this.currentLibrary, this.libraries)
          if (!cls) {
            console.error('!! no cls', codes)
            return
          }
          this.node.data = {
            library: cls.library,
            class: cls.code,
            fn: null
          }
          if (codes.length === 4) {
            this.node.data.fn = codes[3]
          }
          if (this.node.data.fn) {
            const fn = cls.methods[this.node.data.fn] || cls.deep.methods[this.node.data.fn] || null
            if (fn) {
              Object.keys(fn.context.inputs || {}).forEach(incode => {
                this.node.inputs[incode] = jclone(fn.context.inputs[incode])
              })
            }
          }
          this.node.outputs.object.type = `bluep/class/${cls.code}`
          this.node.name = `New ${cls.name}`
        } else {
          console.error('wrong code', next.value)
        }
        this.$emit('update:modelValue', this.node)
      }
    }
  },
  methods: {
    resizeUpdate () {
      if (!this.$refs.graphNode) return
      const rect = this.$refs.graphNode.getBoundingClientRect()
      this.boundingRect = rect
    },
    nodeUpdated () {
      this.$emit('update:modelValue', this.node)
    },
    setDraggable (next) {
      this.$emit('draggable', next)
    },
    mouseDown (e) {
      // console.log(e.path)
      const el = e.path[1]
      if (el.nodeName === 'DIV' && ['node-body', 'slot', 'slot-inputs', 'slot-outputs'].includes(el.className)) {
        this.$emit('draggable', true)
      }
    },
    multipleSlots (mcode) {
      const ret = {
        inputs: {},
        outputs: {}
      }
      Object.keys(this.node.inputs || {}).forEach(infield => {
        if (this.node.inputs[infield].multiple === mcode && !infield.includes('_multiple_')) ret.inputs[infield] = jclone(this.node.inputs[infield])
      })
      Object.keys(this.node.outputs || {}).forEach(outfield => {
        if (this.node.outputs[outfield].multiple === mcode && !outfield.includes('_multiple_')) ret.outputs[outfield] = jclone(this.node.outputs[outfield])
      })
      return ret
    },
    multiplyAdd (direction, code) {
      // console.log('m+', direction, code, this.node[direction][code])
      const mcode = this.node[direction][code].multiple
      if (!mcode) return
      const m = this.node.multiples[mcode]
      const tpl = this.multipleSlots(mcode)
      const now = new Date()
      const subcode = `_multiple_${now.getTime()}`
      Object.keys(tpl.inputs).forEach(incode => {
        const dst = jclone(this.node.inputs[incode])
        delete dst.connections
        dst.code += subcode
        dst.name = this.node.inputs[incode].name + ` <${m.value}>`
        this.node.inputs[dst.code] = dst
      })
      Object.keys(tpl.outputs).forEach(outcode => {
        const dst = jclone(this.node.outputs[outcode])
        delete dst.connections
        dst.code += subcode
        dst.name = this.node.outputs[outcode].name + ` <${m.value}>`
        this.node.outputs[dst.code] = dst
      })
      this.node.multiples[mcode].value++
      this.$emit('update:modelValue', this.node)
    },
    multiplyRemove (direction, code) {
      const codes = code.split('_multiple_')
      const ce = `_multiple_${codes.pop()}`
      const m = this.node[direction][code].multiple
      // console.log('m-', direction, code, ce, m)
      Object.keys(this.node.inputs || {}).forEach(incode => {
        if (!incode.endsWith(ce)) return
        if (Object.keys(this.node.inputs[incode].connections || {}).length) {
          this.$emit('slotClear', {
            node: this.node,
            slot: {
              direction: 'inputs',
              code: incode
            }
          })
        }
        delete this.node.inputs[incode]
      })
      Object.keys(this.node.outputs || {}).forEach(outcode => {
        if (!outcode.endsWith(ce)) return
        if (Object.keys(this.node.outputs[outcode].connections || {}).length) {
          this.$emit('slotClear', {
            node: this.node,
            slot: {
              direction: 'outputs',
              code: outcode
            }
          })
        }
        delete this.node.outputs[outcode]
      })
      this.node.multiples[m].value--
      this.$emit('update:modelValue', this.node)
    }
  },
  computed: {
    nodeClass () {
      const typeClass = this.node.code.replaceAll('/', '-')
      const high = this.highlighted || this.selected ? ' node-highlighted ' : ' '
      const valid = typeof this.node.valid === 'boolean'
        ? this.node.valid
          ? ' '
          : 'node-not-valid'
        : ' '
      return typeClass + high + ' node-type-' + this.node.type + ' ' + valid + ' '
    },
    newClass () {
      if (!this.node.code.startsWith('class/new')) return null
      const clsCodes = this.node.inputs.of.value
      if (!clsCodes) return null
      // if (this.node.data && this.node.data.codes === clsCodes) removeFirst = true
      const codes = clsCodes.split('/')
      if (codes.length >= 3) {
        const cls = classCombined(codes[2], this.currentLibrary, this.libraries)
        return cls
      }
      return null
    },
    slotsRows () {
      const inputs = this.node.inputs ? Object.keys(this.node.inputs) : []
      const outputs = this.node.outputs ? Object.keys(this.node.outputs) : []
      const length = inputs.length > outputs.length ? inputs.length : outputs.length
      const ret = []
      for (let i = 0; i < length; i++) {
        const input = inputs[i] || null
        const output = outputs[i] || null
        ret.push({ input, output })
      }
      return ret
    },
    isDeleteable () {
      return !(this.node.deleteable === false)
    },
    isInputOnly () {
      return Object.keys(this.node.outputs).length === 0
    },
    isOutputOnly () {
      return Object.keys(this.node.inputs).length === 0
    }
  }
}
</script>

<template>
<div
  ref="graphNode"
  class="graph-node"
  :class="nodeClass"
  :style="{
    top: layout.y + 'px',
    left: layout.x + 'px'
  }"
>
  <div v-if="node.type ==='execute'">
    <div
      class="node-header"
      @mousedown.prevent.stop="setDraggable(true)"
      @mouseup="setDraggable(false)"
    >
      {{node.name}}
      <button
        v-if="isDeleteable"
        @click.stop.prevent="$emit('deleteMe')"
        class="icon-button close-icon"
      >
        <i :class="icons.close"></i>
      </button>
    </div>
  </div>
  <div class="node-body" @mousedown="mouseDown">
    <div
      v-if="node.type !=='execute'"
      class="node-body-header"
      :title="node.name"
    >
    <span v-if="node.type === 'modifier' || node.type === 'getter'">{{node.name}}</span>
        <button
        v-if="isDeleteable"
        @click.stop.prevent="$emit('deleteMe')"
        class="icon-button close-icon"
        :class="`close-icon-${node.type}`"
      >
        <i :class="icons.close"></i>
      </button>
    </div>
    <div
      v-for="row, i of slotsRows"
      :key="i"
      :class="{ 'slots-row': !isOutputOnly && !isInputOnly }"
    >
      <div v-if="!isOutputOnly" class="slot">
        <GraphNodeSlot
          v-if="row.input"
          :direction="'inputs'"
          :node="node"
          :types="types"
          :icons="icons"
          :libraries="libraries"
          :modules="modules"
          :currentLibrary="currentLibrary"
          :dragSlot="dragSlot"
          :nodeRect="boundingRect"
          v-model="node.inputs[row.input]"
          @update:modelValue="nodeUpdated"
          @draggable="$emit('slotDraggable', {
            ...$event,
            node: node
          })"
          @dropped="$emit('slotDropped', {
            ...$event,
            node: node
          })"
          @clearMe="$emit('slotClear', {
            ...$event,
            node: node
          })"
          @shiftUpdated="$emit('slotShifted', {
            ...$event,
            node: node,
            nodeRect: boundingRect
          })"
          @multipleAdd="multiplyAdd('inputs', row.input)"
          @multipleRemove="multiplyRemove('inputs', row.input)"
        />
      </div>
      <div v-if="!isInputOnly" class="slot">
        <GraphNodeSlot
          v-if="row.output"
          :direction="'outputs'"
          :node="node"
          :types="types"
          :icons="icons"
          :dragSlot="dragSlot"
          :nodeRect="boundingRect"
          v-model="node.outputs[row.output]"
          @update:modelValue="nodeUpdated"
          @draggable="$emit('slotDraggable', {
            ...$event,
            node: node
          })"
          @dropped="$emit('slotDropped', {
            ...$event,
            node: node
          })"
          @clearMe="$emit('slotClear', {
            ...$event,
            node: node
          })"
          @shiftUpdated="$emit('slotShifted', {
            ...$event,
            node: node,
            nodeRect: boundingRect
          })"
          @multipleAdd="multiplyAdd('outputs', row.output)"
          @multipleRemove="multiplyRemove('outputs', row.output)"
        />
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.graph-node {
  position: absolute;
  border: 1px solid $borderColor;
  background-color: rgba($bgColor, 50%);
  border-radius: $panelPadding;
  font-size: $graphTextSize;
  z-index: 10;

  .close-icon-modifier, .close-icon-getter {
    position: absolute;
    top: -10px !important;
    right: -10px !important;
    left: auto !important;
    width: 24px !important;
    height: 24px !important;
    font-size: 90% !important;
    border-radius: 10px;
    z-index: 8;
  }

  &:hover, &.node-highlighted {
    box-shadow: 0px 0px 10px #aa0;
    .node-header {
      .close-icon {
        display: block;

      }
    }
    .node-body {
      .node-body-header {
        display: block;
        .close-icon {
          display: block;
        }
      }
    }
  }

  .node-header {
    padding: $panelPadding 40px;
    font-weight: bold;
    border-top-right-radius: $panelPadding;
    border-top-left-radius: $panelPadding;
    cursor: grab;
    position: relative;

    .close-icon {
      position: absolute;
      top: 1px;
      right: 2px;
      display: none;
      cursor: pointer;
      width: 25px;
      font-size: 90% !important;
    }
  }

  .node-body {
    padding: $panelPadding;
    position: relative;
    border-bottom-right-radius: $panelPadding;
    border-bottom-left-radius: $panelPadding;

    .node-body-header {
      position: absolute;
      display: none;
      top: 0px;
      left: 0px;
      width: 100%;
      height: 100%;
      text-align: center;

      span {
        margin: 0;
        position: absolute;
        top: 50%;
        left: 50%;
        font-size: 14px;
        transform: translateX(-50%) translateY(-50%);
        font-weight: bold;
        opacity: 0.5;
      }

      .close-icon {
        display: none;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translateX(-50%) translateY(-50%);
        z-index: 5;
        cursor: pointer;
        width: 25px;

        svg {
          fill: #c33;
        }
      }
    }

    .slots-row {
      display: flex;
      justify-content: space-between;
    }

    .slot {
      position: relative;
    }
  }

  &.node-type-execute {
    .node-header {
      background-color: $nodeColorExecute;
    }
  }

  &.node-not-valid {
    border: 2px solid red !important;
  }
}

</style>
