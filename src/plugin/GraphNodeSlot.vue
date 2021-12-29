<script>
import ValueWidget from './ValueWidget.vue'
import { slotTemplateAcceptType } from './graph.js'

export default {
  components: {
    ValueWidget
  },
  props: [
    'node',
    'modelValue',
    'types',
    'libraries',
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
    'templateUpdate'
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
      if (this.slot.type.startsWith('bluep/struct')) return false
      if (this.slot.type.startsWith('bluep/object')) return false
      if (Object.keys(this.slot.connections || {}).length) return false
      return true
    },
    connectorClass () {
      const list = ['connector']
      if (this.slot.isArray) list.push('is-array')
      list.push(`connector-${this.slot.type.replaceAll('/', '-')}`)
      return list.join(' ')
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
    /*
    // TODO: template
    node: {
      deep: true,
      handler (next) {
        console.log('next node', next)
      }
    }
    */
  }
}
</script>

<template>
<div :class="'slot-'+direction">
  <ValueWidget
    v-if="canManual"
    v-model="slot.value"
    :info="slot"
    :inSlot="true"
    :types="types"
    :libraries="libraries"
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
    @mouseup="mouseUp"
    @mousedown.stop.prevent="mouseDown"
  ></div>
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
    top: 3px;
    border-radius: 2px;
    transform: rotate(45deg);
  }
}

.slot-inputs {
  text-align: left;
  padding-left: 5px;
  padding-right: 15px;
  .connector {
    left: -9px;
  }
}

.slot-outputs {
  text-align: right;
  padding-right: 5px;
  padding-left: 15px;
  .connector {
    right: -9px;
  }
}

</style>
