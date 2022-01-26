<script>
import { waitFor } from './utils.js'
import { classCombined } from './graph.js'

export default {
  props: [
    'libraries',
    'modules',
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
    'inPanel'
  ],
  emits: [
    'update:modelValue'
  ],
  data () {
    const def = typeof this.modelValue === 'undefined' ? this.info.value : this.modelValue
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
    widgetClasses () {
      const ret = ['value-widget']
      if (this.size) ret.push(`value-widget-${this.size}`)
      if (this.info.isArray) ret.push('value-widget-array')
      ret.push(`value-widget-${this.info.type.replaceAll('/', '-')}`)
      return ret.join(' ')
    },
    inf () {
      return JSON.stringify(this.info)
    },
    isTextInput () {
      return ['basic/string', 'basic/number', 'basic/float'].includes(this.info.type)
    },
    enumValues () {
      const ecode = this.info.type.slice(11)
      if (this.libraries[this.currentLibrary].enums[ecode]) {
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
        // console.log(cls)
        fns.forEach(f => {
          ret.push(f)
        })
      })
      return ret
    }
  },
  methods: {
    updateValue (next) {
      // console.log('upd', next)
      if (this.info.type === 'basic/string') {
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
</script>

<template>
<div :class="widgetClasses" v-if="!info.isArray">
  <div v-if="labeled" class="value-widget-label">
    <label>{{info.name}}</label>
  </div>
  <div class="value-widget-input">
    <select
      v-if="info.list"
      class="form-select"
      v-model="listVal"
      @change="updateValue"
    >
      <option v-for="opt, oi of info.list" :key="oi" :value="opt">{{opt}}</option>
    </select>
    <input
      v-if="!info.list && info.type === 'basic/string'"
      type="text"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/number'"
      type="number"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
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
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/datetime'"
      type="datetime-local"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/date'"
      type="date"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/time'"
      type="time"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      :value="val"
      :placeholder="info.name"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @input="updateValue"
    />
    <input
      v-if="!info.list && info.type === 'basic/boolean' && (inSlot || !inWidget)"
      type="checkbox"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot}"
      :checked="!!val"
      :disabled="!!disabled"
      :readonly="!!readOnly"
      @change="updateValue"
    />
    <select
      v-if="!info.list && info.type.startsWith('bluep/enum') && (inSlot || !inWidget || inPanel)"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      @change="updateValue"
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
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
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
  </div>
</div>

<div class="value-widget-array-wrapper" v-else>
  <div class="value-widget-array-item" v-for="sval, si of (val || [])" :key="si">
    <div :class="widgetClasses">
      <button @click="remArray(si)" class="icon-button button-small value-widget-array-remove-button">
        <i :class="icons.remove"></i>
      </button>
      <div v-if="labeled" class="value-widget-label">
        <label>{{info.name}}</label>
      </div>
      <div class="value-widget-input">
        <select
          v-if="info.list"
          class="form-select"
          v-model="listVal[si]"
          @change="updateValueI($event, si)"
        >
          <option v-for="opt, oi of info.list" :key="oi" :value="opt">{{opt}}</option>
        </select>
        <input
          v-if="!info.list && info.type === 'basic/string'"
          type="text"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/number'"
          type="number"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
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
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/datetime'"
          type="datetime-local"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/date'"
          type="date"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/time'"
          type="time"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
          :value="val[si]"
          :placeholder="info.name"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @input="updateValueI($event, si)"
        />
        <input
          v-if="!info.list && info.type === 'basic/boolean' && (inSlot || !inWidget)"
          type="checkbox"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot}"
          :checked="!!val[si]"
          :disabled="!!disabled"
          :readonly="!!readOnly"
          @change="updateValueI($event, si)"
        />
        <select
          v-if="!info.list && info.type.startsWith('bluep/enum') && (inSlot || !inWidget || inPanel)"
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
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
          :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
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
      </div>
    </div>

  </div>
  <div class="value-widget-array-push-button-item">
    <button @click="pushArray" class="icon-button button-small value-widget-array-push-button">
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
