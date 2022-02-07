<script>
import ValueWidget from './ValueWidget.vue'
import { slotTemplateAcceptType, classIsParentOfClass } from './graph.js'

export default {
  components: {
    ValueWidget
  },
  props: [
    'node',
    'modelValue',
    'types',
    'icons',
    'libraries',
    'modules',
    'actors',
    'currentLibrary',
    'direction',
    'dragSlot',
    'nodeRect'
  ],
  emits: [
    'update:modelValue',
    'draggable',
    'dropped',
    'clearMe',
    'shiftUpdated',
    'templateUpdate',
    'multipleAdd',
    'multipleRemove'
  ],
  data () {
    return {
      slot: this.modelValue
    }
  },
  methods: {
    updateSlot () {
      this.$emit('update:modelValue', this.slot)
    },
    getShift () {
      const rect = this.$refs.connector.getBoundingClientRect()
      const c = this.$refs.connector
      const p = c.closest('.graph-node')
      const prect = p.getBoundingClientRect()
      return {
        x: rect.x - prect.x + 5,
        y: rect.y - prect.y + 5
      }
    },
    mouseDown (e) {
      if (e.altKey) {
        this.$emit('clearMe', {
          slot: {
            ...this.slot,
            direction: this.direction
          }
        })
      } else {
        this.$emit('draggable', {
          slot: {
            ...this.slot,
            direction: this.direction
          },
          type: this.realType,
          shift: this.getShift()
        })
      }
    },
    mouseUp () {
      if (!this.dragSlot) return
      if (!this.slotEnabled(false)) return
      this.$emit('dropped', {
        slot: {
          ...this.slot,
          direction: this.direction
        },
        type: this.realType,
        shift: this.getShift()
      })
    },
    slotEnabled (self = true) {
      if (!this.dragSlot) return true
      if (self &&
          this.dragSlot.node.id === this.node.id &&
          this.dragSlot.slot.direction === this.direction &&
          this.dragSlot.slot.code === this.slot.code) return true

      if (this.dragSlot.node.id === this.node.id) return false
      if (this.dragSlot.slot.direction === this.direction) return false
      if (!this.acceptType(this.dragSlot.type)) return false
      // if (this.dragSlot.type !== this.realType && this.realType !== 'basic/template') return false
      if (!this.dragSlot.slot.isArray !== !this.slot.isArray) return false
      return true
    },
    acceptType (tp) {
      if (tp === this.realType) return true
      if (this.realType === 'basic/template') {
        const template = this.node.templates[this.slot.template]
        return slotTemplateAcceptType(template, tp)
      }
      if (this.realType.startsWith('bluep/class/') && tp.startsWith('bluep/class/')) {
        // const clss1 = this.realType.split('/')
        // const clss2 = tp.split('/')
        const cls1 = this.realType.slice(12)
        const cls2 = tp.slice(12)
        return this.direction === 'inputs'
          ? classIsParentOfClass(cls1, cls2, this.libraries, this.modules)
          : classIsParentOfClass(cls2, cls1, this.libraries, this.modules)
      }
      return false
    }
  },
  computed: {
    realType () {
      const type = this.slot.type
      // template case
      if (this.slot.type === 'basic/template') {
        const tpl = this.node.templates[this.slot.template]
        return tpl.type || type
      }
      return type
    },
    getColor () {
      const ret = this.slotEnabled() && this.types
        ? this.types[this.realType]
          ? this.types[this.realType].color
          : '#999'
        : '#999'
      /*
      if (ret === '#999') {
        console.log(this.realType, this.types, this.types[this.realType])
      }
      /**/
      return ret
    },
    canManual () {
      // console.log('can manual?', this.slot)
      if (this.direction === 'outputs') return false
      if (this.slot.manual === false) return false
      if (this.slot.isArray) return false
      if (this.slot.type === 'basic/execute') return false
      if (this.slot.type === 'basic/datetime') return false
      if (this.slot.type === 'bluep/classselector') return true
      if (this.slot.type.startsWith('bluep/struct')) return false
      if (this.slot.type.startsWith('bluep/class')) return false
      if (this.slot.type.startsWith('bluep/object')) return false
      if (Object.keys(this.slot.connections || {}).length) return false
      return true
    },
    canConnect () {
      if (this.slot.type === 'bluep/classselector') return false
      return true
    },
    connectorClass () {
      const list = ['connector']
      if (this.slot.isArray) list.push('is-array')
      if (this.slot.type) list.push(`connector-${this.slot.type.replaceAll('/', '-')}`)
      if (!this.canConnect) list.push('connector-invisible')
      return list.join(' ')
    },
    canMultipleAdd () {
      if (!this.slot.multiple) return false
      if (!this.node.multiples || !this.node.multiples[this.slot.multiple]) return false
      if (this.slot.code.includes('_multiple_')) return false
      if (this.direction === 'outputs') return false
      const m = this.node.multiples[this.slot.multiple]
      if (typeof m.max !== 'number') return true
      return m.max > m.value
    },
    canMultipleRemove () {
      if (!this.slot.multiple) return false
      if (!this.node.multiples || !this.node.multiples[this.slot.multiple]) return false
      if (!this.slot.code.includes('_multiple_')) return false
      if (this.direction === 'outputs') return false
      const m = this.node.multiples[this.slot.multiple]
      const min = typeof m.min === 'number' && m.min >= 1 ? m.min : 1
      return m.value > min
    }
  },
  watch: {
    modelValue: {
      handler (next) {
        this.slot = next
      },
      deep: true
    },
    nodeRect () {
      this.$emit('shiftUpdated', {
        slot: {
          ...this.slot,
          direction: this.direction
        },
        shift: this.getShift()
      })
    }
  }
}
</script>

<template>
<div :class="`slot-${direction} ${canMultipleRemove ? 'slot-multiple-removable' : ''}`">
  <button
    v-if="canMultipleRemove"
    class="icon-button button-multiple-remove"
    @click="$emit('multipleRemove')"
  >
    <i :class="icons.remove"></i>
  </button>
  <ValueWidget
    v-if="canManual"
    v-model="slot.value"
    :info="slot"
    :inSlot="true"
    :types="types"
    :icons="icons"
    :libraries="libraries"
    :modules="modules"
    :actors="actors"
    :currentLibrary="currentLibrary"
    @update:modelValue="updateSlot"
  />
  <span v-else>{{slot.name}}</span>
  <div
    :class="connectorClass"
    ref="connector"
    :style="{
      backgroundColor: getColor
    }"
    :title="slot.type"
    @mouseup="mouseUp"
    @mousedown.stop.prevent="mouseDown"
  />
  <button
    v-if="canMultipleAdd"
    class="icon-button button-multiple-add"
    @click="$emit('multipleAdd')"
  >
    <i :class="icons.add"></i>
  </button>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.connector {
  position: absolute;
  width: 10px;
  height: 10px;
  top: 4px;
  border-radius: 5px;

  &.is-array {
    top: 1px;
    border-radius: 2px;
    transform: rotate(45deg);
  }

  &.connector-invisible {
    visibility: hidden;
  }
}

.button-multiple-add {
  font-size: 80% !important;
  height: 20px !important;
  line-height: 20px !important;
}

.button-multiple-remove {
  font-size: 80% !important;
  height: 20px !important;
  line-height: 20px !important;
  width: 15px !important;
  display: inline;
  position: absolute;
  top: 0px;
}
.slot-inputs {
  text-align: left;
  padding-left: 5px;
  padding-right: 15px;
  .connector {
    left: -9px;
  }
  .button-multiple-remove {
    right: 0;
  }
  &.slot-multiple-removable {
    // margin-right: 20px;
  }
}

.slot-outputs {
  text-align: right;
  padding-right: 5px;
  padding-left: 15px;
  .connector {
    right: -9px;
  }
  .button-multiple-remove {
    left: 0;
  }
}

</style>
