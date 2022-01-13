<script>
import VariableButton from './PanelVariableButton.vue'
import VariableIcon from './VariableIcon.vue'
import { jclone, waitFor } from './utils.js'
import { v4 as uuid } from 'uuid'
import { classCombined } from './graph.js'

export default {
  name: 'ClassBuilderMethod',
  /**/
  components: {
    VariableButton,
    VariableIcon
  },
  /**/
  props: [
    'libraries',
    'currentLibrary',
    'types',
    'modules',
    'icons',
    'dialogs',
    'modelValue',
    'cls',
    'deep'
  ],
  emits: [
    'update:modelValue',
    'selectVariable',
    'removeMe',
    'overrideMe'
  ],
  data () {
    return {
      data: jclone(this.modelValue || {}),
      open: false
    }
  },
  computed: {
    methodAccess () {
      return this.data.access || 'public'
    },
    overrideSource () {
      const cls = classCombined(this.cls.code, this.cls.library, this.libraries, this.modules)
      const orig = cls.deep.overrides[this.data.overrides]
      // console.log('os', cls, orig, this.data.overrides)
      return `${orig.source.name}::${orig.name}`
    }
  },
  methods: {
    addInout (path) {
      const code = uuid()
      const vr = {
        code,
        name: 'Variable',
        type: 'basic/boolean'
      }
      this.data.context[path][code] = vr
      this.$emit('update:modelValue', this.data)
      this.$emit('selectVariable', {
        fn: this.data.code,
        path,
        code
      })
    },
    removeInout (path, code) {
      delete this.data.context[path][code]
      this.$emit('selectVariable', null)
      this.$emit('update:modelValue', this.data)
    },
    selectInout (path, code) {
      this.$emit('selectVariable', {
        fn: this.data.code,
        path,
        code
      })
    },
    async emitUpdate () {
      await waitFor(0)
      this.$emit('update:modelValue', this.data)
    },
    xxx () {
      console.log(this.data.source, this.cls)
    }
  },
  watch: {
    modelValue (next) {
      if (next.code === this.data.code) return
      this.data = jclone(next)
      this.open = false
    }
  }
}
</script>

<template>
<div>
  <div class="d-flex wrapper">
    <div class="info">
      <button v-if="!deep && !data.overrides" @click="open = !open" class="icon-button button-small no-wrap">
        <i v-if="!open" :class="icons.chevronRight"></i>
        <i v-else :class="icons.chevronDown"></i>
      </button>
      <span class="mr-5">[{{methodAccess}}]</span>
      <span>{{data.name}}</span>
      <span>(
        <span
          v-for="incode of Object.keys(data.context.inputs || {})"
          :key="incode"
          class="mr-5"
        >
          <VariableIcon
            :type="data.context.inputs[incode].type"
            :isArray="data.context.inputs[incode].isArray"
            :types="types"
          />
          <span class="ml-5">{{data.context.inputs[incode].name}}</span>
        </span>
      )</span>
      <span v-if="data.type !== 'constructor'" class="mr-5 ml-5">-&gt;</span>
      <span v-if="data.type !== 'constructor'">(
        <span
          v-for="incode of Object.keys(data.context.outputs || {})"
          :key="incode"
          class="mr-5"
        >
          <VariableIcon
            :type="data.context.outputs[incode].type"
            :isArray="data.context.outputs[incode].isArray"
            :types="types"
          />
          <span class="ml-5">{{data.context.outputs[incode].name}}</span>
        </span>
      )</span>
    </div>
    <div class="controls d-flex">
      <div>
      </div>
      <div v-if="deep">
        <button @click="$emit('overrideMe');" title="Override" class="icon-button button-small w-auto">
          <span class="no-wrap">
            <i :class="icons.add"></i>
            Override [{{data.source.name}}::{{data.name}}]
          </span>
          <!--
          -->
        </button>
      </div>
      <div class="d-flex" v-else>
        <button title="Remove" @click="$emit('removeMe')" class="w-auto icon-button button-small">
          <span v-if="!data.overrides">Remove</span>
          <span v-else>Clear override [{{overrideSource}}]</span>
          <i :class="icons.remove" class="ml-5"></i>
        </button>
      </div>
    </div>
  </div>
  <div class="inouts" v-if="open">
    <div v-if="!deep && data.type !== 'constructor'" class="panel-body">
      <div class="d-flex">
        <label class="label-access">Access</label>
        <div class="widget-access">
          <select class="panel-input text-dark" v-model="data.access" @change="emitUpdate">
            <option value="public">Public</option>
            <option value="protected">Protected</option>
            <option value="private">Private</option>
          </select>
        </div>
        <label class="label-rename">Rename</label>
        <div class="widget-rename">
          <input class="panel-input text-dark" v-model="data.name" @update:modelValue="emitUpdate"/>
        </div>
      </div>
    </div>
    <div class="panel-header">
      Inputs
      <button v-if="!deep" title="Add" @click="addInout('inputs')" class="icon-button button-small">
        <i :class="icons.add"></i>
      </button>
    </div>
    <div class="panel-body">
      <div
        v-for="fcode of Object.keys(data.context.inputs)"
        :key="fcode"
      >
        <VariableButton
          :variable="data.context.inputs[fcode]"
          :types="types"
          :icons="icons"
          :noRemove="!!deep"
          @click="selectInout('inputs', fcode)"
          @remove="removeInout('inputs', fcode)"
        />
      </div>
    </div>
    <div v-if="data.type !== 'constructor'" class="panel-header">
      Outputs
      <button v-if="!deep" title="Add" @click="addInout('outputs')" class="icon-button button-small">
        <i :class="icons.add"></i>
      </button>
    </div>
    <div v-if="data.type !== 'constructor'" class="panel-body">
      <div
        v-for="fcode of Object.keys(data.context.outputs)"
        :key="fcode"
      >
        <VariableButton
          :variable="data.context.outputs[fcode]"
          :types="types"
          :icons="icons"
          :noRemove="!!deep"
          @click="selectInout('outputs', fcode)"
          @remove="removeInout('outputs', fcode)"
        />
      </div>
    </div>
  </div>
</div>
</template>

<style scoped>
.wrapper {
  justify-content: space-between;
}
.controls {
  text-align: right
}
.label-access, .widget-access, .label-rename {
  flex: 0 0 120px;
}
.widget-rename {
  flex: 1 1 auto;
}
.inouts {
  margin-left: 55px;
}
</style>
