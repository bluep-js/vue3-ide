<script>
import ValueWidget from './ValueWidget.vue'
import {
  slotTemplateKeys,
  slotAcceptSlotArray,
  slotTemplateAcceptSlot,
  classIsParentOfClass
} from './graph.js'
import { jclone } from './utils.js'

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
    updateSlot (x) {
      this.slot.value = x
      // console.log('@updateSlot@', x, this.slot)
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
            ...this.computedSlot,
            direction: this.direction
          },
          type: this.computedType,
          shift: this.getShift()
        })
      }
    },
    mouseUp () {
      if (!this.dragSlot) return
      if (!this.slotEnabled(false)) return
      this.$emit('dropped', {
        slot: {
          ...this.computedSlot,
          direction: this.direction
        },
        type: this.computedType,
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
      if (!this.acceptType(this.dragSlot)) return false
      return true
    },
    acceptType (slot) {
      if (slot.type === this.computedType) return slotAcceptSlotArray(slot.slot, this.computedSlot)
      if (this.computedType === 'basic/template') {
        const cslot = this.computedSlot
        return slotTemplateAcceptSlot(slot.slot, cslot, this.node.templates[cslot._tkey])
      }
      if (!slotAcceptSlotArray(slot.slot, this.computedSlot)) return false
      if (this.computedType.startsWith('bluep/class/') && slot.startsWith('bluep/class/')) {
        const cls1 = this.computedType.slice(12)
        const cls2 = slot.slice(12)
        return this.direction === 'inputs'
          ? classIsParentOfClass(cls1, cls2, this.libraries, this.modules)
          : classIsParentOfClass(cls2, cls1, this.libraries, this.modules)
      }
      return false
    }
  },
  computed: {
    computedType () {
      const type = this.slot.type
      if (this.slot.type !== 'basic/template') return type
      const tpl = slotTemplateKeys(this.node, this.slot)
      if (!tpl || !tpl.tkey) return type
      if (!this.node.templates[tpl.tkey].value) return type
      return this.node.templates[tpl.tkey].value.type || type
    },
    computedSlot () {
      const src = {
        isArray: 0,
        canBeArray: false,
        ...jclone({ ...this.slot })
      }
      if (src.isArray === true) src.isArray = 1
      if (this.slot.type !== 'basic/template') return src
      const tpl = slotTemplateKeys(this.node, this.slot)
      if (!tpl || !tpl.tkey) return src
      if (!this.node.templates[tpl.tkey]) return src
      const template = this.node.templates[tpl.tkey]
      Object.keys(template.info || {}).forEach(ikey => {
        src[ikey] = template.info[ikey]
      })
      src._tkey = tpl.tkey
      src._vkey = tpl.vkey
      Object.keys(template.value || {}).forEach(ikey => {
        src[ikey] = template.value[ikey]
      })
      if (!tpl.vkey || !this.node.templates[tpl.tkey].variants) return src
      const variant = this.node.templates[tpl.tkey].variants[tpl.vkey]
      if (!variant) return src
      Object.keys(variant.info || {}).forEach(ikey => {
        src[ikey] = variant.info[ikey]
      })
      Object.keys(variant.$add || {}).forEach(ikey => {
        src[ikey] += variant.$add[ikey]
      })
      return src
    },
    getColor () {
      const ret = this.slotEnabled() && this.types
        ? this.types[this.computedType]
          ? this.types[this.computedType].color
          : '#999'
        : '#999'
      /*
      if (ret === '#999') {
        console.log(this.computedType, this.types, this.types[this.computedType])
      }
      /**/
      return ret
    },
    canManual () {
      // console.log('can manual?', this.slot)
      if (this.direction === 'outputs') return false
      if (this.computedSlot.manual === false) return false
      if (this.computedSlot.isArray) return false
      if (this.computedSlot.type === 'basic/template') return false
      if (this.computedSlot.type === 'basic/execute') return false
      if (this.computedSlot.type === 'basic/datetime') return false
      if (this.computedSlot.type === 'bluep/classselector') return true
      if (this.computedSlot.type.startsWith('bluep/struct')) return false
      if (this.computedSlot.type.startsWith('bluep/class')) return false
      if (this.computedSlot.type.startsWith('bluep/object')) return false
      if (Object.keys(this.slot.connections || {}).length) return false
      return true
    },
    canConnect () {
      if (this.computedSlot.type === 'bluep/classselector') return false
      return true
    },
    connectorClass () {
      const list = ['connector']
      if (this.computedSlot.isArray) list.push('is-array')
      if (!this.computedSlot.isArray && this.computedSlot.canBeArray) list.push('can-be-array')
      if (this.computedSlot.type) list.push(`connector-${this.slot.type.replaceAll('/', '-')}`)
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
    :modelValue="computedSlot.value"
    :info="computedSlot"
    :inSlot="true"
    :types="types"
    :icons="icons"
    :libraries="libraries"
    :modules="modules"
    :actors="actors"
    :currentLibrary="currentLibrary"
    @update:modelValue="updateSlot"
  />
  <span v-else>{{computedSlot.name}}</span>
  <div
    :class="connectorClass"
    ref="connector"
    :style="{
      backgroundColor: getColor
    }"
    :title="computedSlot.type + (computedSlot.isArray ? `[${computedSlot.isArray}]` : computedSlot.canBeArray ? '[?]' : '')"
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
    top: 2px;
    border-radius: 2px;
    transform: rotate(45deg);
  }

  &.can-be-array {
    top: 3px;
    right: -10px !important;
    border: 0px;
    transform: rotate(45deg);
    animation: arrayMutation 12s infinite ease-in-out;
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

@keyframes arrayMutation {
  0% {
    border-radius: 5px;
  }
  50% {
    border-radius: 2px;
  }
  100% {
    border-radius: 5px;
  }
}
</style>
