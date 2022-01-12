<script>
import { waitFor } from './utils.js'
import { classCombined } from './graph.js'

export default {
  props: [
    'libraries',
    'currentLibrary',
    'types',
    'info',
    'modelValue',
    'inSlot',
    'inWidget',
    'inPanel'
  ],
  emits: [
    'update:modelValue'
  ],
  data () {
    const def = typeof this.modelValue === 'undefined' ? this.info.value : this.modelValue
    return {
      val: def
    }
  },
  created () {
    waitFor(0).then(() => {
      if (this.modelValue !== this.val) {
        this.$emit('update:modelValue', this.val)
      }
    })
  },
  computed: {
    inf () {
      return JSON.stringify(this.info)
    },
    isTextInput () {
      return ['basic/string', 'basic/number', 'basic/float'].includes(this.info.type)
    },
    enumValues () {
      const ecode = this.info.type.split('/').pop()
      const enm = this.libraries[this.currentLibrary].enums[ecode]
      return enm.values
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
          this.val = next
        } else {
          this.val = next.target.checked
        }
      }
      if (this.info.type.startsWith('bluep/enum')) {
        this.val = next.target.value
      }
      if (this.info.type === 'bluep/classselector') {
        this.val = next.target.value
      }
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
<div class="value-widget">
  <div v-if="info.isArray">

  </div>
  <div :class="'value-widget-' + info.type.replaceAll('/','-')" v-else>
    <input
      v-if="isTextInput"
      type="text"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot && !inPanel, 'panel-input text-dark': inPanel}"
      :value="val"
      :placeholder="info.name"
      @input="updateValue"
    />
    <label v-if="info.type === 'basic/boolean' && inSlot">{{info.name}}</label>
    <input
      v-if="info.type === 'basic/boolean' && (inSlot || !(inWidget || inPanel))"
      type="checkbox"
      :class="{'in-slot': inSlot, 'bg-white': !inSlot}"
      :checked="!!val"
      @change="updateValue"
    />
    <select
      v-if="info.type.startsWith('bluep/enum') && (inSlot || !inWidget || inPanel)"
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
      v-if="info.type === 'bluep/classselector' && (inSlot || !inWidget || inPanel)"
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
    <!--
    <button @click="updateValue(!val)" v-if="info.type === 'basic/boolean' && (inWidget || inPanel)" class="button-clear">
      <i v-if="!!val" class="fas fa-2x fa-toggle-on text-primary"></i>
      <i v-else class="fas fa-2x fa-toggle-off"></i>
    </button>
    -->
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

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
