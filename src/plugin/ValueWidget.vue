<script>
import { waitFor } from './utils.js'
import { classCombined } from './graph.js'

export default {
  name: 'BluepJsValueWidget',
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
      ? Array.isArray(def) ? def.map(x => !!x && typeof x.toString === 'function' ? x.toString() : '') : []
      : typeof def === 'undefined' || def === null ? '' : def.toString()
    return {
      val: def,
      listVal: list
    }
  },
  async created () {
    await waitFor(0)
    if (this.modelValue !== this.val) {
      this.$emit('update:modelValue', this.val)
    }
  },
  computed: {
    fieldDepth () {
      if (typeof this.depth !== 'number') return 0
      return this.depth
    },
    widgetClasses () {
      let ret = ['value-widget']
      ret.push(`value-widget-depth-${this.fieldDepth}`)
      if (this.size) ret.push(`value-widget-${this.size}`)
      if (this.info.isArray) ret.push('value-widget-array')
      ret.push(`value-widget-${this.info.type.replaceAll('/', '-')}`)
      if (this.addCls('widget')) ret.push(this.addCls('widget'))
      const over = this.overCls('widget')
      if (typeof over === 'string') ret = [this.overCls('widget'), `value-widget-depth-${this.fieldDepth}`]
      return ret.join(' ').trim()
    },
    inf () {
      return JSON.stringify(this.info)
    },
    /*
    isTextInput () {
      return ['basic/string', 'basic/number', 'basic/float'].includes(this.info.type)
    },
    */
    fieldStruct () {
      const scode = this.info.type.slice(13)
      if (this.libraries[this.currentLibrary].structs && this.libraries[this.currentLibrary].structs[scode]) {
        return this.libraries[this.currentLibrary].structs[scode].schema
      }
      let module = null
      Object.keys(this.modules || {}).forEach(m => {
        if (this.modules[m].structs && this.modules[m].structs[scode]) module = m
      })
      if (!module) return {}
      const ret = this.modules[module].structs[scode].schema
      return ret
    },
    enumValues () {
      const ecode = this.info.type.slice(11)
      if (this.libraries[this.currentLibrary].enums && this.libraries[this.currentLibrary].enums[ecode]) {
        return this.libraries[this.currentLibrary].enums[ecode].values
      }
      let module = null
      Object.keys(this.modules || {}).forEach(m => {
        if (this.modules[m].enums && this.modules[m].enums[ecode]) module = m
      })
      if (!module) return {}
      return this.modules[module].enums[ecode].values
    },
    constructorsOptions () {
      const ret = []
      Object.values(this.libraries[this.currentLibrary].classes || {}).forEach(cc => {
        const cls = classCombined(cc.code, cc.library, this.libraries)
        const fns = []
        // search direct class constructors
        Object.values(cls.methods || {}).forEach(m => {
          if (m.type === 'constructor') {
            const args = Object.values(m.context.inputs || {}).map(inp => inp.name)
            fns.push({
              label: `${cls.name}(${args.join(',')})`,
              value: `bluep/class/${cls.code}/${m.code}`
            })
          }
        })
        // search parents constructors
        if (!fns.length) {
          Object.values(cls.deep.methods || {}).forEach(m => {
            if (m.type === 'constructor') {
              const args = Object.values(m.context.inputs || {}).map(inp => inp.name)
              fns.push({
                label: `${cls.name}(${args.join(',')})`,
                value: `bluep/class/${cls.code}/${m.code}`
              })
            }
          })
        }
        fns.forEach(f => {
          ret.push(f)
        })
      })
      return ret
    }
  },
  methods: {
    updateValue (next) {
      if (this.info.type === 'basic/string') {
        this.val = next.target.value
      }
      if (this.info.type === 'basic/color') {
        this.val = next.target.value
      }
      if (this.info.type === 'basic/number') {
        this.val = parseInt(next.target.value)
      }
      if (this.info.type === 'basic/float') {
        this.val = parseFloat(next.target.value)
      }
      if (this.info.type === 'basic/boolean') {
        if (typeof next === 'boolean') {
          this.val = !!next
        } else {
          this.val = !!next.target.checked
        }
      }
      if (this.info.type === 'datetime' || this.info.type === 'date' || this.info.type === 'time') {
        const v = next.target.value
        this.val = v
      }
      if (this.info.type.startsWith('bluep/enum')) {
        this.val = next.target.value
      }
      if (this.info.type === 'bluep/classselector') {
        this.val = next.target.value
      }
      this.$emit('update:modelValue', this.val)
    },
    updateValueI (next, i) {
      let nextVal
      if (this.info.type === 'basic/string') {
        nextVal = next.target.value
      }
      if (this.info.type === 'basic/color') {
        nextVal = next.target.value
      }
      if (this.info.type === 'basic/number') {
        nextVal = parseInt(next.target.value)
      }
      if (this.info.type === 'basic/float') {
        nextVal = parseFloat(next.target.value)
      }
      if (this.info.type === 'basic/boolean') {
        if (typeof next === 'boolean') {
          nextVal = !!next
        } else {
          nextVal = !!next.target.checked
        }
      }
      if (this.info.type === 'datetime' || this.info.type === 'date' || this.info.type === 'time') {
        const v = next.target.value
        nextVal = v
      }
      if (this.info.type.startsWith('bluep/enum')) {
        nextVal = next.target.value
      }
      if (this.info.type === 'bluep/classselector') {
        nextVal = next.target.value
      }
      this.val[i] = nextVal
      if (this.info.list) {
        this.listVal[i] = typeof nextVal === 'undefined'
          ? ''
          : nextVal.toString()
      }
    },
    updateStructValue (fcode, next) {
      if (!this.val) this.val = {}
      this.val[fcode] = next
      this.$emit('update:modelValue', this.val)
    },
    updateStructValueI (i, fcode, next) {
      if (!this.val[i]) this.val[i] = {}
      this.val[i][fcode] = next
      this.$emit('update:modelValue', this.val)
    },
    pushArray () {
      if (!this.val || !Array.isArray(this.val)) {
        this.val = []
        this.listVal = []
        // console.log('new arr', this.val)
      }
      this.val.push(undefined)
      if (this.info.list) this.listVal.push('')
      // console.log('push arr', this.val)
      this.$emit('update:modelValue', this.val)
    },
    remArray (index) {
      this.val = this.val.filter((x, i) => i !== index)
      if (this.info.list) this.listVal = this.listVal.filter((x, i) => i !== index)
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
    inputClasses (initial = '', type) {
      let ret = initial.split(' ')
      if (this.inSlot) ret.push('in-slot')
      if (this.inPanel) {
        ret.push('panel-input')
        ret.push('text-dark')
      }
      if (!this.inSlot && !this.inPanel) ret.push('bg-white')
      const cc = `input-${type}`
      if (this.addCls(cc)) ret.push(this.addCls(cc))
      const over = this.overCls(cc)
      if (typeof over === 'string') ret = [this.overCls(cc)]
      return ret.join(' ').trim()
    },
    elementClasses (initial = '', cc) {
      let list = initial.split(' ')
      list.push(this.addCls(cc) || '')
      const over = this.overCls(cc)
      if (typeof over === 'string') list = [over]
      return list.join(' ').trim()
    }
  },
  watch: {
    modelValue: {
      handler (next) {
        // console.log('next val', next)
        if (this.val !== next) {
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
<div :class="widgetClasses" v-if="!info.isArray">
  <div v-if="labeled" :class="elementClasses('value-widget-label', 'labeledContainer')">
    <label :class="elementClasses('', 'labeledLabel')">{{info.name}}</label>
  </div>
  <div :class="elementClasses('value-widget-input', 'widgetContainer')">
    <select
      v-if="info.list"
      class="form-select"
      :class="inputClasses('', 'select')"
      v-model="listVal"
      @change="updateValue"
    >
      <option v-for="opt, oi of info.list" :key="oi" :value="opt">{{opt}}</option>
    </select>
    <input
      v-if="!info.list && info.type === 'basic/string'"
      type="text"
      :class="inputClasses('', 'string')"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/number'"
      type="number"
      :class="inputClasses('', 'number')"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/float'"
      type="number"
      step="any"
      :class="inputClasses('', 'float')"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/color'"
      type="color"
      :class="inputClasses('', 'color')"
      :value="val"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/datetime'"
      type="datetime-local"
      :class="inputClasses('', 'datetime')"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/date'"
      type="date"
      :class="inputClasses('', 'date')"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/time'"
      type="time"
      :class="inputClasses('', 'time')"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/boolean' && (inSlot || !inWidget)"
      type="checkbox"
      :class="inputClasses('', 'checkbox')"
      :checked="!!val"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @change="updateValue"
    />
    <select
      v-if="!info.list && info.type.startsWith('bluep/enum') && (inSlot || !inWidget || inPanel)"
      @change="updateValue"
      :class="inputClasses('', 'select')"
      v-model="val"
    >
      <option
        v-for="opt of Object.keys(enumValues)"
        :key="opt"
        :value="opt"
        :selected="opt === val"
      >{{enumValues[opt]}}</option>
    </select>
    <select
      v-if="!info.list && info.type === 'bluep/classselector' && (inSlot || !inWidget || inPanel)"
      :class="inputClasses('', 'select')"
      @change="updateValue"
      v-model="val"
    >
      <option
        v-for="opt, oi of constructorsOptions"
        :key="oi"
        :value="opt.value"
        :selected="opt.value === val"
      >{{opt.label}}</option>
    </select>
    <div v-if="!info.list && info.type.startsWith('bluep/struct') && (inSlot || !inWidget || inPanel)" :class="elementClasses('', 'structWrapper')">
      <div v-for="fld of Object.values(fieldStruct)" :key="fld.code" :class="elementClasses('', 'struct-field')">
        <BluepJsValueWidget
          :libraries="libraries"
          :modules="modules"
          :currentLibrary="currentLibrary"
          :icons="icons"
          :types="types"
          :info="fld"
          :inPanel="inPanel"
          :size="size"
          :modelValue="val[fld.code]"
          :labeled="labeled"
          :disabled="disabled"
          :readOnly="readOnly"
          :inSlot="inSlot"
          :inWidget="inWidget"
          :overclasses="overclasses"
          :addclasses="addclasses"
          :depth="fieldDepth + 1"
          @update:modelValue="updateStructValue(fld.code, $event)"
        />
      </div>
    </div>
  </div>
</div>

<div :class="elementClasses('value-widget-array-wrapper', 'widgetArray')" v-else>
  <div :class="elementClasses('value-widget-array-item', 'arrayItem')" v-for="sval, si of (val || [])" :key="si">
    <div :class="widgetClasses">
      <button @click="remArray(si)" :class="elementClasses('icon-button button-small value-widget-array-remove-button', 'buttonArrayRemove')">
        <i :class="icons.remove"></i>
      </button>
      <div v-if="labeled" :class="elementClasses('value-widget-label', 'labeledContainer')">
        <label :class="elementClasses('', 'labeledLabel')">{{info.name}}</label>
      </div>
      <div :class="elementClasses('value-widget-input', 'widgetContainer')">
        <select
          v-if="info.list"
          :class="inputClasses('', 'select')"
          v-model="listVal[si]"
          @change="updateValueI($event, si)"
        >
          <option v-for="opt, oi of info.list" :key="oi" :value="opt">{{opt}}</option>
        </select>
        <input
          v-if="!info.list && info.type === 'basic/string'"
          type="text"
          :class="inputClasses('', 'string')"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/number'"
          type="number"
          :class="inputClasses('', 'number')"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/float'"
          type="number"
          step="any"
          :class="inputClasses('', 'float')"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/color'"
          type="color"
          :class="inputClasses('', 'color')"
          :value="val[si]"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/datetime'"
          type="datetime-local"
          :class="inputClasses('', 'datetime')"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/date'"
          type="date"
          :class="inputClasses('', 'date')"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/time'"
          type="time"
          :class="inputClasses('', 'time')"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/boolean' && (inSlot || !inWidget)"
          type="checkbox"
          :class="inputClasses('', 'checkbox')"
          :checked="!!val[si]"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @change="updateValueI($event, si)"
        />
        <select
          v-if="!info.list && info.type.startsWith('bluep/enum') && (inSlot || !inWidget || inPanel)"
          :class="inputClasses('', 'select')"
          @change="updateValueI($event, si)"
          v-model="val[si]"
        >
          <option
            v-for="opt of Object.keys(enumValues)"
            :key="opt"
            :value="opt"
            :selected="opt === val"
          >{{enumValues[opt]}}</option>
        </select>
        <select
          v-if="!info.list && info.type === 'bluep/classselector' && (inSlot || !inWidget || inPanel)"
          :class="inputClasses('', 'select')"
          @change="updateValueI($event, si)"
          v-model="val[si]"
        >
          <option
            v-for="opt, oi of constructorsOptions"
            :key="oi"
            :value="opt.value"
            :selected="opt.value === val"
          >{{opt.label}}</option>
        </select>
        <div v-if="!info.list && info.type.startsWith('bluep/struct') && (inSlot || !inWidget || inPanel)" :class="elementClasses('', 'structWrapper')">
          <div v-for="fld of Object.values(fieldStruct)" :key="fld.code" :class="elementClasses('', 'struct-field')">
            <BluepJsValueWidget
              :libraries="libraries"
              :modules="modules"
              :currentLibrary="currentLibrary"
              :icons="icons"
              :types="types"
              :info="fld"
              :inPanel="inPanel"
              :size="size"
              :modelValue="val[si][fld.code]"
              :labeled="labeled"
              :disabled="disabled"
              :readOnly="readOnly"
              :inSlot="inSlot"
              :inWidget="inWidget"
              :overclasses="overclasses"
              :addclasses="addclasses"
              :depth="fieldDepth + 1"
              @update:modelValue="updateStructValueI(si, fld.code, $event)"
            />
          </div>
        </div>
      </div>
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
