<script>
import VariableButton from './PanelVariableButton.vue'

export default {
  name: 'GraphVariablesBar',
  components: {
    VariableButton
  },
  props: [
    'name',
    'types',
    'variables',
    'icons',
    'readOnly'
  ],
  emits: [
    'addVariable',
    'editVariable',
    'deleteVariable'
  ],
  computed: {
    vars () {
      return Object.values(this.variables)
    }
  }
}
</script>

<template>
<div class="wrapper">
  <div class="header">
    <span>{{name}}</span>
    <div>
      <button v-if="!readOnly" @click="$emit('addVariable')" class="icon-button">
        <i :class="icons.add"></i>
      </button>
    </div>
  </div>
  <div class="body">
    <div
      v-for="v of vars"
      :key="v.code"
    >
      <VariableButton
        :variable="v"
        :icons="icons"
        :types="types"
        :noRemove="readOnly"
        :noClick="readOnly"
        @click="$emit('editVariable', v.code)"
        @remove="$emit('deleteVariable', v.code)"
      />
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.header {
  display: flex;
  justify-content: space-between;
  background-color: $panelHeaderBackground;
  margin-bottom: 5px;
  padding-left: 10px;
}

.body {
  padding-left: 10px;
}
</style>
