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
    'currentLibrary',
    // 'fn',
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
    // console.log('node created', this.node, this.fn)
    await waitFor(0)
    const ro = new ResizeObserver(this.resizeUpdate)
    ro.observe(this.$refs.graphNode)
  },
  watch: {
    'node.inputs.of': {
      deep: true,
      handler (next/*, prev*/) {
        // console.log('next of', next, prev)
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
    }
  },
  computed: {
    nodeClass () {
      const typeClass = this.node.code.replaceAll('/', '-')
      const high = this.highlighted ? ' node-highlighted ' : ' '
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
      /**/
      /**/
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
      >
        <span v-if="node.type === 'modifier'">{{node.name}}</span>
        <button
          v-if="isDeleteable"
          @click.stop.prevent="$emit('deleteMe')"
          class="icon-button close-icon"
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
          :libraries="libraries"
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
        />
      </div>
      <div v-if="!isInputOnly" class="slot">
        <GraphNodeSlot
          v-if="row.output"
          :direction="'outputs'"
          :node="node"
          :types="types"
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

  &:hover, &.node-highlighted {
    box-shadow: 0px 0px 10px #aa0;
    .node-header {
      .close-icon {
        display: block;
      }
    }
    .node-body {
      .node-body-header {
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
      top: 1px;;
      right: 2px;
      display: none;
      cursor: pointer;
      width: 25px;

      svg {
        fill: #c33;
      }
    }
  }

  .node-body {
    padding: $panelPadding;
    position: relative;
    border-bottom-right-radius: $panelPadding;
    border-bottom-left-radius: $panelPadding;

    .node-body-header {
      position: absolute;
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
