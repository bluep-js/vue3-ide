<script>
import { jclone } from './utils.js'
import { v4 as uuid } from 'uuid'
import VariableButton from './PanelVariableButton.vue'
// import VariableIcon from './VariableIcon.vue'
import VariablePanel from './GraphVariablePanel.vue'
import ClassMethod from './ClassBuilderMethod.vue'

import { newFunction, availableClasses, classParents, classIsParentOf, classCombined } from './graph.js'

// import { v4 as uuid } from 'uuid'
export default {
  name: 'ClassBuilder',
  components: {
    ClassMethod,
    VariableButton,
    // VariableIcon,
    VariablePanel
  },
  props: [
    'libraries',
    'modules',
    'nodes',
    'types',
    'icons',
    'currentLibrary',
    'modelValue',
    'dialogs'
  ],
  emits: ['update:modelValue'],
  data () {
    return {
      data: jclone(this.modelValue),
      saved: true,
      selected: null,
      selectedFnInout: null,
      selExtends: '',
      selMethod: ''
    }
  },
  computed: {
    nameError () {
      return this.data.name === '' || Object.values(this.libraries[this.currentLibrary].structs)
        .reduce((acc, enm) => acc || (enm.code !== this.data.code && enm.name === this.data.name), false)
    },
    classesList () {
      const map = availableClasses(this.libraries, this.currentLibrary, this.modules)
      delete map[this.data.code]

      return Object.values(map)
    },
    extendsOptions () {
      const map = availableClasses(this.libraries, this.currentLibrary, this.modules)
      delete map[this.data.code]
      const ret = {
        module: {},
        library: {}
      }
      const exts = this.extendsList

      Object.values(map).forEach(cls => {
        if (cls.module) {
          if (!ret.module[cls.module]) ret.module[cls.module] = {}
          ret.module[cls.module][cls.code] = cls
          if (exts.index && exts.index.includes(`module/${cls.module}/${cls.code}`)) {
            ret.module[cls.module][cls.code].disabled = true
          }
        }
        if (cls.library) {
          if (!ret.library[cls.library]) ret.library[cls.library] = {}
          ret.library[cls.library][cls.code] = cls
          if (exts.index && exts.index.includes(`library/${cls.library}/${cls.code}`)) {
            ret.library[cls.library][cls.code].disabled = true
          }
          if (classIsParentOf(this.data.code, this.data.library, cls.code, cls.library, this.libraries, this.modules)) {
            ret.library[cls.library][cls.code].disabled = true
          }
        }
      })
      return ret
    },
    // faking libraries with current (not saved) version
    fakeLibs () {
      const libs = jclone(this.libraries)
      libs[this.data.library].classes[this.data.code] = jclone(this.data)
      return libs
    },
    extendsList () {
      return classParents(this.data.code, this.data.library, this.fakeLibs, this.modules)
    },
    extendsProps () {
      const cls = classCombined(this.data.code, this.data.library, this.fakeLibs, this.modules)
      return cls.deep.schema
    },
    extendsMethods () {
      const cls = classCombined(this.data.code, this.data.library, this.fakeLibs, this.modules)
      return cls.deep.methods
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
        schema: this.data.schema
      }
      return ret
    }
  },
  methods: {
    // extends
    addExtends () {
      if (this.selExtends === '') return
      const infs = this.selExtends.split('/')
      const add = {
        code: infs[2]
      }
      if (infs[0] === 'module') add.module = infs[1]
      if (infs[0] === 'library') add.library = infs[1]
      this.data.extends[infs.join('/')] = add
      this.selExtends = ''
      this.saved = false
    },
    removeExtends (ext) {
      if (ext.module) {
        delete this.data.extends[`module/${ext.module}/${ext.code}`]
      }
      if (ext.library) {
        delete this.data.extends[`library/${ext.library}/${ext.code}`]
      }
      this.saved = false
    },
    // methods
    async addMethod () {
      if (this.selMethod === '') return
      const info = {
        code: uuid(),
        library: this.currentLibrary,
        type: this.selMethod
      }
      if (this.selMethod === 'constructor') {
        info.name = 'Constructor'
      }
      if (this.selMethod === 'method') {
        info.name = await this.dialogs.prompt('Method Name')
        if (!info.name) {
          this.selMethod = ''
          return
        }
      }
      const fn = newFunction(info, this.nodes)
      fn.class = this.data.code
      fn.access = 'public'
      if (!this.data.methods) this.data.methods = {}
      this.data.methods[fn.code] = fn
      this.saved = false
      this.selMethod = ''
    },
    selectFnInout (inf) {
      // console.log('select inout', inf)
      this.selectedFnInout = inf
    },
    updateFnInout (/*inf*/) {
      /*
      // Object.keys(
      const sel = this.selectedFnInout
      if (sel && sel.path === 'input') {
        const enid = this.data.methods[sel.fn].entry
        Object.keys(this.data.methods[sel.fn].context.inputs).forEach(fcode => {
          if (!this.data.methods[sel.fn].graph.nodes[enid].outputs[fcode]) {
            this.data.methods[sel.fn].graph.nodes[enid].outputs[fcode] = jclone(inf)
          }
        })
        Object.keys(this.data.methods[sel.fn].graph.nodes[enid].outputs).forEach(fcode => {
          if (!this.data.methods[sel.fn].context.inputs[fcode]) {
            if (!this.data.methods[sel.fn].graph.nodes[enid].outputs[fcode].connections) {
              delete this.data.methods[sel.fn].graph.nodes[enid].outputs[fcode]
            }
          }
        })
        console.log('update fn inout', inf, sel, enid)
      }
      */
      this.saved = false
    },
    async removeMethod (code) {
      const ok = await this.dialogs.confirm('Remove Method?')
      if (!ok) return
      delete this.data.methods[code]
      this.saved = false
    },
    overrideMethod (code) {
      const src = this.extendsMethods[code]
      const info = {
        code: uuid(),
        library: this.currentLibrary,
        type: src.type,
        name: src.name
      }
      const fn = newFunction(info, this.nodes)
      fn.class = this.data.code
      fn.access = src.access
      fn.context.inputs = jclone(src.context.inputs)
      fn.context.outputs = jclone(src.context.outputs)
      fn.overrides = code
      // console.log('override', info, code, fn)
      if (!this.data.methods) this.data.methods = {}
      this.data.methods[fn.code] = fn
      this.saved = false
    },
    // properties schema
    async addValue () {
      const code = await this.dialogs.prompt('Field Code')
      const exts = this.extendsProps
      if (!code || !code.length || this.data.schema[code] || exts[code]) {
        if (code && (this.data.schema[code] || exts[code])) {
          await this.dialogs.alert('Already exists')
        }
        return
      }
      this.data.schema[code] = {
        code,
        name: 'Variable',
        type: 'basic/boolean',
        access: 'public',
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
      delete this.data.schema[vcode]
      this.saved = false
    },
    updateStruct () {
      this.$emit('update:modelValue', this.data)
      this.saved = true
    }
  },
  watch: {
    modelValue: {
      deep: true,
      handler (next) {
        this.selected = null
        this.selectedFnInout = null
        this.data = jclone(next)
        this.saved = true
      }
    },
    'data.methods': {
      deep: true,
      handler () {
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
          Class builder
        </div>
        <div class="panel-body">
          <div class="mt-2r mb-2 panel-row">
            <div class="panel-row-label">
              <label>Code</label>
            </div>
            <div class="panel-row-widget">
              <input class="text-dark panel-input" type="text" disabled v-model="data.code"/>
            </div>
          </div>
          <div class="mb-2r panel-row">
            <div class="panel-row-label">
              <label>Name</label>
            </div>
            <div class="panel-row-widget">
              <input class="text-dark panel-input" type="text" v-model="data.name" @update:modelValue="saved = false"/>
              <blockquote v-if="nameError" class="danger">
                <i>Can't be empty</i>
              </blockquote>
            </div>
          </div>
        </div>
        <div class="panel-header">
          Extends
          <select class="panel-input text-dark" v-model="selExtends" @change="addExtends">
            <option value="">Add</option>
            <!--
            <optgroup
              v-for="mcode of Object.keys(extendsOptions.module)"
              :key="mcode"
              :label="`Module ${modules[mcode].name}`"
            >
              <option
                v-for="ccode of Object.keys(extendsOptions.module[mcode])"
                :key="ccode"
                :value="`module/${mcode}/${ccode}`"
                :disabled="extendsOptions.module[mcode][ccode].disabled"
              >
                {{extendsOptions.module[mcode][ccode].name}}
              </option>
            </optgroup>
            -->
            <optgroup
              v-for="lcode of Object.keys(extendsOptions.library)"
              :key="lcode"
              :label="libraries[lcode].name"
            >
              <option
                v-for="ccode of Object.keys(extendsOptions.library[lcode])"
                :key="ccode"
                :value="`library/${lcode}/${ccode}`"
                :disabled="extendsOptions.library[lcode][ccode].disabled"
              >
                {{extendsOptions.library[lcode][ccode].name}}
              </option>
            </optgroup>
          </select>
        </div>
        <div class="panel-body">
          <div class="d-flex">
            <div
              class="px-5p extends extends-direct"
              v-for="ext, i of extendsList.direct"
              :key="i"
            >
              {{ext.src.name}}
              <button class="icon-button button-small" @click="removeExtends(ext)">
                <i :class="icons.remove"></i>
              </button>
            </div>
            <div
              class="px-5p extends extends-back"
              v-for="ext, i of extendsList.back"
              :key="i"
            >{{ext.src.name}}</div>
          </div>
        </div>
        <div class="panel-header">
          Methods
          <!--
          <button @click="addMethod()" class="icon-button button-small"><i :class="icons.add"></i></button>
          -->
          <select class="panel-input text-dark" v-model="selMethod" @change="addMethod">
            <option value="">Add</option>
            <option value="constructor">Constructor</option>
            <option value="method">Method</option>
          </select>
        </div>
        <div class="panel-body">
          <div
            v-for="mcode of Object.keys(data.methods || {})"
            :key="mcode"
            class="mb-2"
          >
            <ClassMethod
              :libraries="fakeLibs"
              :currentLibrary="currentLibrary"
              :types="types"
              :modeules="modules"
              :icons="icons"
              :dialogs="dialogs"
              :cls="data"
              v-model="data.methods[mcode]"
              @update:modelValue="updateFnInout()"
              @selectVariable="selectFnInout"
              @removeMe="removeMethod(mcode)"
            />
          </div>
          <div
            v-for="mcode of Object.keys(extendsMethods || {})"
            :key="mcode"
            class="mb-2"
          >
            <ClassMethod
              deep="1"
              :libraries="fakeLibs"
              :currentLibrary="currentLibrary"
              :types="types"
              :modeules="modules"
              :icons="icons"
              :dialogs="dialogs"
              :cls="data"
              v-model="extendsMethods[mcode]"
              @overrideMe="overrideMethod(mcode)"
            />
          </div>
        </div>
        <div class="panel-header">
          Properties <button @click="addValue()" class="icon-button button-small"><i :class="icons.add"></i></button>
        </div>
        <div class="panel-body">
          <div
            v-for="vcode of Object.keys(data.schema || {})"
            :key="vcode"
            class="mb-2"
          >
            <VariableButton
              withCode="1"
              withAccess="1"
              :variable="data.schema[vcode]"
              :types="types"
              :icons="icons"
              @click="selected = vcode"
              @remove="selected = null; delValue(vcode)"
            />
          </div>
          <div
            v-for="vcode of Object.keys(extendsProps || {})"
            :key="vcode"
            class="mb-2"
          >
            <VariableButton
              withCode="1"
              withAccess="1"
              withSource="1"
              noRemove="1"
              noClick="1"
              :variable="extendsProps[vcode]"
              :types="types"
              :icons="icons"
            />
          </div>
        </div>
        <div>
          <div class="controls">
            <button class="icon-button w-auto" :disabled="saved || nameError" @click="updateStruct()">
              <i :class="icons.save"></i>
              <span class="ml-5">Update</span>
            </button>
          </div>
        <!--
          <div class="row">
            {{data}}
          </div>
        -->
        <!--
        -->
        </div>
      </div>
    </div>
  </div>
  <div class="panel" v-if="!!selected">
    <VariablePanel
      withAccess="1"
      :libraries="libraries"
      :currentLibrary="currentLibrary"
      :variable="data.schema[selected]"
      :types="types"
      :icons="icons"
      :context="panelContext"
      direction="schema"
      @closeMe="selected = null"
      @variableUpdated="updateValue"
    />
  </div>
  <div class="panel" v-if="!!selectedFnInout">
    <VariablePanel
      :libraries="libraries"
      :currentLibrary="currentLibrary"
      :variable="data.methods[selectedFnInout.fn].context[selectedFnInout.path][selectedFnInout.code]"
      :types="types"
      :icons="icons"
      :context="data.methods[selectedFnInout.fn].context"
      :direction="selectedFnInout.path"
      @closeMe="selectedFnInout = null"
      @variableUpdated="updateFnInout"
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

.extends {
  border: 1px solid $borderColor;
  margin-right: 10px;
}

.extends-back {
  border: 1px dotted $borderColor;
}
</style>
