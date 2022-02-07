<script>
import ValueWidget from './ValueWidget.vue'
import VariableIcon from './VariableIcon.vue'

import { waitFor } from './utils.js'

export default {
  components: {
    VariableIcon,
    // CloseIcon,
    ValueWidget
  },
  props: [
    'libraries',
    'modules',
    'actors',
    'currentLibrary',
    'variable',
    'types',
    'icons',
    'context',
    'direction',
    'withAccess'
  ],
  emits: [
    'variableUpdated',
    'typeChanged',
    'closeMe'
  ],
  data () {
    return {
      vr: this.variable,
      errors: {
        name: null
      }
    }
  },
  watch: {
    variable: {
      handler (next) {
        this.vr = next
      },
      deep: true
    }
  },
  methods: {
    nameChanged () {
      this.errors.name = null
      Object.values(this.context.inputs || {}).forEach(slot => {
        if (slot.code === this.vr.code) return
        if (slot.name === this.vr.name) this.errors.name = 'Already exists'
      })
      Object.values(this.context.outputs || {}).forEach(slot => {
        if (slot.code === this.vr.code) return
        if (slot.name === this.vr.name) this.errors.name = 'Already exists'
      })
      Object.values(this.context.variables || {}).forEach(slot => {
        if (slot.code === this.vr.code) return
        if (slot.name === this.vr.name) this.errors.name = 'Already exists'
      })
      Object.values(this.context[this.direction] || {}).forEach(slot => {
        if (slot.code === this.vr.code) return
        if (slot.name === this.vr.name) this.errors.name = 'Already exists'
      })
      if (this.errors.name) return
      this.$emit('variableUpdated', this.vr)
    },
    async isArrayChanged () {
      await waitFor(0)
      this.undefineValue()
      this.$emit('typeChanged')
    },
    typeChanged () {
      this.undefineValue()
      this.$emit('typeChanged')
    },
    accessChanged () {
      // this.undefineValue()
      this.$emit('typeChanged')
    },
    defineValue () {
      this.vr.value = null
      this.$emit('variableUpdated', this.vr)
    },
    undefineValue () {
      delete this.vr.value
      this.$emit('variableUpdated', this.vr)
    },
    valueChanged () {
      this.$emit('variableUpdated', this.vr)
    }
  }
}
</script>

<template>
<div class="bluep-panel-wrapper">
  <div class="bluep-panel">
    <div class="panel-header">
      <div class="title">
        <VariableIcon
          class="variable-icon"
          :types="types"
          :type="vr.type"
          :isArray="vr.isArray"
        />
        <b>{{direction}}/{{vr.name}}</b>
      </div>
      <button @click="$emit('closeMe')" class="icon-button">
        <i :class="icons.close"></i>
      </button>
    </div>
    <div class="panel-body">
      <table>
        <tr>
          <td width="50%">Name</td>
          <td>
            <input
              type="text"
              v-model="vr.name"
              @input="nameChanged"
              class="panel-input text-dark"
              :class="{ error: errors.name }"
              :title="errors.name || 'Variable name'"
            />
          </td>
        </tr>
        <tr v-if="withAccess">
          <td>Access</td>
          <td>
            <select
              v-model="vr.access"
              class="panel-input text-dark w-100"
              @change="accessChanged"
            >
              <option value="public">public</option>
              <option value="protected">protected</option>
              <option value="private">private</option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Type</td>
          <td>
            <select
              v-model="vr.type"
              class="panel-input text-dark w-100"
              @change="typeChanged"
            >
              <option
                v-for="tp of types"
                :key="tp.code"
                :value="tp.code"
              >
                {{tp.name}}
              </option>
            </select>
          </td>
        </tr>
        <tr>
          <td>Array</td>
          <td>
            <input
              id="is-array"
              type="checkbox"
              v-model="vr.isArray"
              class="panel-input"
              @input="isArrayChanged"
            />
          </td>
        </tr>
      </table>
    </div>
    <div class="panel-header">
      <div class="title">Default value</div>
      <button v-if="typeof vr.value === 'undefined'" @click="defineValue()" class="define-button button-small button-outline">
        Define
      </button>
      <button v-else @click="undefineValue()" class="define-button button-small button-outline">
        Undefine
      </button>
    </div>
    <div class="panel-body">
      <div v-if="typeof vr.value === 'undefined'">Not defined</div>
      <div v-else>
        <table>
          <tr>
            <td class="no-wrap pr-5p">{{vr.name}}</td>
            <td>
              <ValueWidget
                v-model="vr.value"
                :libraries="libraries"
                :modules="modules"
                :actors="actors"
                :currentLibrary="currentLibrary"
                :icons="icons"
                :types="types"
                :info="vr"
                inPanel="1"
                @update:modelValue="valueChanged()"
              />
            </td>
          </tr>
        </table>
<!--
{{vr}}
-->
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

td {
  text-align: left;
}

input {
  &.error {
    border-color: red;
  }
}

.error-name {
  font-size: 80%;
  color: red;
}

.define-button {
  border: 1px solid $borderColor;
  background: none;
  color: $textColor;
  border-radius: 3px;
  font-size: 80%;
}

.variable-icon {
  margin-right: 4px;
  margin-bottpm: 0;
}

</style>
