<script>
import GraphVariablesBar from './GraphVariablesBar.vue'
import ValueWidget from './ValueWidget.vue'
// import parser from 'cron-parser'

export default {
  components: {
    GraphVariablesBar,
    ValueWidget
  },
  props: [
    'fn',
    'cls',
    'types',
    'icons',
    'isMethod'
  ],
  emits: [
    'addVariable',
    'editVariable',
    'deleteVariable',
    'updateName',
    'updateConfig'
  ],
  data () {
    return {
      fnname: this.fn.name || '',
      config: this.fn.event?.config || {}
    }
  },
  computed: {
    confs () {
      const ret = []
      // console.log('confs', this.fn)
      if (!this.fn.event?.info?.config) {
        return ret
      }
      Object.values(this.fn.event.info.config).forEach(f => {
        ret.push(f)
      })
      return ret
    },
    canBeRenamed () {
      if (this.fn.type === 'constructor') return false
      return true
    }
  },
  methods: {
    updateName () {
      if (this.fnname === '') return
      this.$emit('updateName', this.fnname)
    }
  },
  watch: {
    fn: {
      handler (next) {
        this.fnname = next.name || ''
        this.config = next.event?.config || {}
      }
    }
  }
}
</script>

<template>
<div class="bluep-panel-wrapper">
  <div class="bluep-panel">
    <div class="panel-header">
      <div class="title d-flex">
        <div class="title-icon">
          <i v-if="!fn.event" :class="icons.function + ' ' + icons.fw"></i>
          <i v-else :class="icons.event + ' ' + icons.fw"></i>
        </div>
        <div class="title-input">
          <span v-if="!canBeRenamed">{{fnname}}</span>
          <input v-else type="text" class="panel-input text-dark" @input="updateName" v-model="fnname"/>
        </div>
      </div>
    </div>
    <div class="panel-header" v-if="confs.length">
      Configuration
    </div>
    <div class="panel-body" v-if="confs.length">
      <div v-for="cfg of confs" :key="cfg.code" class="d-flex">
        <label>{{cfg.name}}</label>
        <ValueWidget
          :info="cfg"
          v-model="config[cfg.code]"
          :inPanel="true"
          @update:modelValue="$emit('updateConfig', config)"
        />
      </div>
    </div>
    <div class="panel-header" v-if="confs.length"/>
    <div class="panel-body">
      <GraphVariablesBar
        v-if="!fn.event"
        :name="'Inputs'"
        :types="types"
        :variables="fn.context.inputs"
        :icons="icons"
        class="mb-10"
        @addVariable="$emit('addVariable', 'inputs')"
        @deleteVariable="$emit('deleteVariable', { code: $event, path: 'inputs' })"
        @editVariable="$emit('editVariable', { code: $event, path: 'inputs' })"
      />
      <GraphVariablesBar
        v-if="!fn.event"
        :name="'Outputs'"
        :types="types"
        :icons="icons"
        class="mb-10"
        :variables="fn.context.outputs"
        @addVariable="$emit('addVariable', 'outputs')"
        @deleteVariable="$emit('deleteVariable', { code: $event, path: 'outputs' })"
        @editVariable="$emit('editVariable', { code: $event, path: 'outputs' })"
      />
      <GraphVariablesBar
        :name="'Variables'"
        :types="types"
        :variables="fn.context.variables"
        :icons="icons"
        @addVariable="$emit('addVariable', 'variables')"
        @deleteVariable="$emit('deleteVariable', { code: $event, path: 'variables' })"
        @editVariable="$emit('editVariable', { code: $event, path: 'variables' })"
      />
      <GraphVariablesBar
        v-if="cls"
        :readOnly="true"
        :name="'Properties'"
        :types="types"
        :variables="cls.schema"
        :icons="icons"
      />
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.title {
  .title-icon {
    flex: 0 0 30px;
    font-weight: bold;
  }

  .title-input {
    flex: 1 1 auto;
  }
}

label {
  margin: 0;
  input {
    margin: 0;
    margin-right: 1rem;
  }
}
</style>
