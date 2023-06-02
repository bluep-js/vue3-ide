<script>
import { waitFor, isEqual } from './utils.js'
import BluepJsValueWidgetSingle from './ValueWidgetSingle'

export default {
  name: 'BluepJsValueWidgetArray',
  components: {
    BluepJsValueWidgetSingle
  },
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
    'depth',
    'arrayDepth'
  ],
  emits: [
    'update:modelValue'
  ],
  data () {
    let def = typeof this.modelValue === 'undefined' ? this.info.value : this.modelValue
    if (this.info.type.startsWith('bluep/struct/') && !def) def = {}
    const list = this.info.isArray
      ? Array.isArray(def) ? def : []
      : typeof def === 'undefined' || def === null ? '' : def.toString()
    /*
    const list = Array.isArray(def)
      ? def.map(x => !!x && typeof x.toString === 'function' ? x.toString() : '')
      : []
    */
    return {
      val: list
      // listVal: list
    }
  },
  async created () {
    await waitFor(0)
    // if (this.modelValue !== this.val) {
    if (!isEqual(this.modelValue, this.val)) {
      console.log('VWA::created !==', this.modelValue, this.val)
      this.$emit('update:modelValue', this.val)
    }
  },
  computed: {
    isArrayBottom () {
      return this.info.isArray && this.arrayDepth === 0
    },
    arrayDim () {
      let ret = 0
      if (this.info.isArray) {
        ret = typeof this.info.isArray === 'number'
          ? this.info.isArray
          : 1
      }
      return ret
    },
    isArrayDepth () {
      let ret = 0
      if (this.info.isArray) {
        const arrDepth = typeof this.infoisArray === 'number'
          ? this.info.isArray
          : 1
        const currDepth = typeof this.arrayDepth === 'number' ? this.arrayDepth : 1
        ret = arrDepth - currDepth
      }
      return ret
    },
    fieldDepth () {
      if (typeof this.depth !== 'number') return 0
      return this.depth
    },
    widgetClasses () {
      let ret = ['value-widget']
      ret.push(`value-widget-depth-${this.fieldDepth}`)
      if (this.size) ret.push(`value-widget-${this.size}`)
      if (this.info.isArray) {
        ret.push('value-widget-array')
        ret.push(`value-widget-array-depth-${this.arrayDepth}`)
      }
      ret.push(`value-widget-${this.info.type.replaceAll('/', '-')}`)
      if (this.addCls('widget')) ret.push(this.addCls('widget'))
      const over = this.overCls('widget')
      if (typeof over === 'string') ret = [this.overCls('widget'), `value-widget-depth-${this.fieldDepth}`]
      return ret.join(' ').trim()
    },
    inf () {
      return JSON.stringify(this.info)
    }
  },
  methods: {
    updateValueI (i, next) {
      this.val[i] = next
    },
    pushArray () {
      if (!this.val || !Array.isArray(this.val)) {
        this.val = []
        // this.listVal = []
        // console.log('new arr', this.val)
      }
      if (this.isArrayBottom) {
        // if (this.info.list) this.listVal.push('')
        if (this.info.list) this.val.push('')
        else this.val.push(undefined)
      } else {
        this.val.push([])
      }
      console.log('push arr', this.val.slice())
      this.$emit('update:modelValue', this.val)
    },
    remArray (index) {
      this.val = this.val.filter((x, i) => i !== index)
      // if (this.info.list) this.listVal = this.listVal.filter((x, i) => i !== index)
      this.$emit('update:modelValue', this.val)
    },
    addCls (code) {
      if (this.addclasses && typeof this.addclasses[code] === 'string') return this.addclasses[code]
      return null
    },
    overCls (code) {
      if (this.overclasses && typeof this.overclasses[code] === 'string') return this.overclasses[code]
      return null
    },
    elementClasses (initial = '', cc) {
      let list = initial.split(' ')
      list.push(this.addCls(cc) || '')
      const over = this.overCls(cc)
      if (typeof over === 'string') list = [over]
      return list.join(' ').trim()
    },
    defaultSingleValue (i) {
      if (!this.info.value || !Array.isArray(this.info.value)) return undefined
      return this.info.value[i]
    },
    defaultArrayValue (i) {
      if (!this.info.value || !Array.isArray(this.info.value)) return undefined
      return this.info.value[i] || []
    }
  },
  watch: {
    modelValue: {
      handler (next) {
        // if (this.val !== next) {
        if (!isEqual(next, this.val)) {
          console.log('VWA::watchModelValue', next)
          this.val = next
        }
      },
      deep: true
    }
  }
}
/*

*/
</script>

<template>
<div :class="elementClasses('value-widget-array-wrapper', 'widgetArray')">
  <div :class="elementClasses('value-widget-array-item', 'arrayItem')" v-for="sval, si of (val || [])" :key="si">
    <div :class="widgetClasses">
      <button @click="remArray(si)" :class="elementClasses('icon-button button-small value-widget-array-remove-button', 'buttonArrayRemove')">
        <i :class="icons.remove"></i>
      </button>
      <BluepJsValueWidgetSingle
        v-if="isArrayBottom"
        :libraries="libraries"
        :modules="modules"
        :currentLibrary="currentLibrary"
        :icons="icons"
        :types="types"
        :info="{
          ...info,
          value: defaultSingleValue(si)
        }"
        :inPanel="inPanel"
        :size="size"
        :modelValue="val[si]"
        :labeled="labeled"
        :disabled="disabled"
        :readOnly="readOnly"
        :inSlot="inSlot"
        :inWidget="inWidget"
        :overclasses="overclasses"
        :addclasses="addclasses"
        :depth="depth + 1"
        :arrayDepth="arrayDepth - 1"
        @update:modelValue="updateValueI(si, $event)"
      />
      <BluepJsValueWidgetArray
        v-else
        :libraries="libraries"
        :modules="modules"
        :currentLibrary="currentLibrary"
        :icons="icons"
        :types="types"
        :info="{
          ...info,
          value: defaultArrayValue(si)
        }"
        :inPanel="inPanel"
        :size="size"
        :modelValue="val[si]"
        :labeled="labeled"
        :disabled="disabled"
        :readOnly="readOnly"
        :inSlot="inSlot"
        :inWidget="inWidget"
        :overclasses="overclasses"
        :addclasses="addclasses"
        :depth="depth + 1"
        :arrayDepth="arrayDepth - 1"
        @update:modelValue="updateValueI(si, $event)"
      />
    </div>
  </div>
  <div :class="elementClasses('value-widget-array-push-button-item', 'buttonArrayAddContainer') ">
    <button @click="pushArray" :class="elementClasses('icon-button button-small value-widget-array-push-button', 'buttonArrayAdd')">
      <i :class="icons.add"></i>
    </button>
  </div>
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
