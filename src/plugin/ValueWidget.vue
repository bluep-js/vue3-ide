<script>
import { waitFor, isEqual } from './utils.js'
// import { waitFor } from './utils.js'
// import { classCombined } from './graph.js'

import BluepJsValueWidgetSingle from './ValueWidgetSingle'
import BluepJsValueWidgetArray from './ValueWidgetArray'

export default {
  name: 'BluepJsValueWidget',
  /*
  components: {
    BluepJsValueWidgetSingle,
    BluepJsValueWidgetArray
  },
  */
  props: [
    'libraries',
    'modules',
    'actors',
    'currentLibrary',
    'types',
    'info',
    'icons',
    'size',
    'modelValue',
    'labeled',
    'disabled',
    'readOnly',
    'inSlot',
    'inWidget',
    'inPanel',
    'overclasses',
    'addclasses',
    'depth'
  ],
  emits: [
    'update:modelValue'
  ],
  data () {
    let def = typeof this.modelValue === 'undefined' ? this.info.value : this.modelValue
    if (this.info.type.startsWith('bluep/struct/') && !def) def = {}
    const list = this.info.isArray
      ? Array.isArray(def) ? def : []
      // ? def.map(x => !!x && typeof x.toString === 'function' ? x.toString() : '')
      // : []
      : typeof def === 'undefined' || def === null ? '' : def.toString()
    return {
      val: this.info.isArray ? list : def
    }
  },
  async created () {
    await waitFor(0)
    // if (this.modelValue !== this.val) {
    if (!isEqual(this.modelValue, this.val)) {
      // console.log('VW::created !==', this.modelValue, this.val)
      this.$emit('update:modelValue', this.val)
    }
  },
  computed: {
    fieldDepth () {
      if (typeof this.depth !== 'number') return 0
      return this.depth
    },
    fieldComponent () {
      if (this.info.isArray) return BluepJsValueWidgetArray
      return BluepJsValueWidgetSingle
    }
  },
  methods: {
    updateValue (next) {
      // console.log('VW::updateValue', next)
      this.val = next
      this.$emit('update:modelValue', this.val)
    }
  },
  watch: {
    modelValue: {
      handler (next) {
        // if (this.val !== next) {
        if (!isEqual(next, this.val)) {
          // console.log('VW::watchModelValue', next)
          this.val = next
        }
      },
      deep: true
    },
    val: {
      handler (next) {
        // if (this.val !== next) {
        // console.log('VW::watcher??val', next)
        this.$emit('update:modelValue', this.val)
        if (!isEqual(next, this.modelValue)) {
          // console.log('VW::watcher++val', next)
          // this.val = next
        }
      },
      deep: true
    }
  }
}
</script>

<template>
<div class="bluepjs-widget-wrapper">
  <component
    :is="fieldComponent"
    :libraries="libraries"
    :modules="modules"
    :currentLibrary="currentLibrary"
    :icons="icons"
    :types="types"
    :info="info"
    :inPanel="inPanel"
    :size="size"
    :labeled="labeled"
    :disabled="disabled"
    :readOnly="readOnly"
    :inSlot="inSlot"
    :inWidget="inWidget"
    :overclasses="overclasses"
    :addclasses="addclasses"
    :depth="fieldDepth"
    :arrayDepth="(info.isArray || 1) - 1"
    :modelValue="val"
    @update:modelValue="updateValue($event)"
  />
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.value-widget {
  display: flex;
}

.in-slot {
  font-size: $graphTextSize - 2;
  width: auto;
  max-width: 60px;
  background: #fff;
  line-height: $graphTextSize + 6;
  height: $graphTextSize + 6;
  min-width: $graphTextSize + 6;
  margin-bottom: 0;
  padding: 0px 2px;

  opacity: 0.5;

  &:focus {
    opacity: 1;
  }

  &[type="checkbox"] {
    margin: 0;
  }
}

label {
  position: relative;
  top: -5px;
  display: inline;
  flex: auto;
  font-size: $graphTextSize;
  margin-right: 5px;
}
</style>
