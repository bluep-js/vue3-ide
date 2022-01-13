<script>
import { jclone } from './utils.js'
import VariableButton from './PanelVariableButton.vue'
import VariablePanel from './GraphVariablePanel.vue'

// import { v4 as uuid } from 'uuid'
export default {
  name: 'StructBuilder',
  components: {
    VariableButton,
    VariablePanel
  },
  props: [
    'libraries',
    'types',
    'icons',
    'currentLibrary',
    'modelValue'
  ],
  emits: ['update:modelValue'],
  data () {
    return {
      structData: JSON.parse(JSON.stringify(this.modelValue)),
      saved: true,
      selected: null
    }
  },
  methods: {
    addValue () {
      const code = prompt('Enter field code')
      if (!code || !code.length || this.structData.schema[code]) {
        if (code && this.structData.schema[code]) {
          alert('Already exists')
        }
        return
      }
      this.structData.schema[code] = {
        code,
        name: 'Variable',
        type: 'basic/boolean',
        isArray: false
      }
      this.saved = false
      this.selected = code
    },
    updateValue () {
      // console.log(this.selected, data)
      this.saved = false
    },
    delValue (vcode) {
      delete this.structData.schema[vcode]
      this.saved = false
    },
    updateStruct () {
      this.$emit('update:modelValue', this.structData)
      this.saved = true
    }
  },
  computed: {
    nameError () {
      return this.structData.name === '' || Object.values(this.libraries[this.currentLibrary].structs)
        .reduce((acc, enm) => acc || (enm.code !== this.structData.code && enm.name === this.structData.name), false)
    },
    typesList () {
      // console.log('list', this.types)
      const ret = jclone(this.types)
      delete ret['basic/execute']
      return ret
      /*
      if (!this.types) return []
      return this.types.filter(tp => {
        console.log('tp', tp)
        return true
      })
      /**/
    },
    panelContext () {
      const ret = {
        schema: this.structData.schema
      }
      return ret
    }
  },
  watch: {
    modelValue: {
      deep: true,
      handler (next) {
        this.structData = JSON.parse(JSON.stringify(next))
        this.saved = true
      }
    }
  }
}
</script>

<template>
<div class="wrapper">
  <div class="builder">
    <div class="bluep-panel-wrapper text-left">
      <div class="bluep-panel">
        <div class="panel-header">
          Struct properties
        </div>
        <div class="panel-body">
          <div class="mt-2r mb-2 panel-row">
            <div class="panel-row-label">
              <label>Code</label>
            </div>
            <div class="panel-row-widget">
              <input class="text-dark panel-input" type="text" disabled v-model="structData.code"/>
            </div>
          </div>
          <div class="mb-2r panel-row">
            <div class="panel-row-label">
              <label>Name</label>
            </div>
            <div class="panel-row-widget">
              <input class="text-dark panel-input" type="text" v-model="structData.name" @update:modelValue="saved = false"/>
              <blockquote v-if="nameError" class="danger">
                <i>Exists or empty</i>
              </blockquote>
            </div>
          </div>
        </div>
        <div class="panel-header">
          Schema <button @click="addValue()" class="icon-button button-small"><i :class="icons.add"></i></button>
        </div>
        <div class="panel-body">
          <div
            v-for="vcode of Object.keys(structData.schema)"
            :key="vcode"
            class="mb-2"
          >
            <VariableButton
              withCode="1"
              :variable="structData.schema[vcode]"
              :types="types"
              :icons="icons"
              @click="selected = vcode"
              @remove="selected = null; delValue(vcode)"
            />
          </div>
          <div class="controls">
            <button :disabled="saved || nameError" @click="updateStruct()">Update</button>
          </div>
        <!--
        <div class="row">
          {{structData}}
        </div>
        -->
        </div>
      </div>
    </div>
  </div>
  <div class="panel" v-if="!!selected">
    <VariablePanel
      :libraries="libraries"
      :currentLibrary="currentLibrary"
      :variable="structData.schema[selected]"
      :types="types"
      :icons="icons"
      :context="panelContext"
      direction="schema"
      @closeMe="selected = null"
      @variableUpdated="updateValue"
    />
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.wrapper {
  display: flex;
  align-items: stretch;
}

.builder {
  flex-grow: 1;
}

.panel {
  width: $panelWidth;
}
</style>
