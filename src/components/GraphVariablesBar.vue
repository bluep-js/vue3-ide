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
    'icons'
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
    <button @click="$emit('addVariable')" class="icon-button">
      <i :class="icons.add"></i>
    </button>
  </div>
  <div
    v-for="v of vars"
    :key="v.code"
  >
    <VariableButton
      :variable="v"
      :icons="icons"
      :types="types"
      @click="$emit('editVariable', v.code)"
      @remove="$emit('deleteVariable', v.code)"
    />
  </div>
</div>
</template>

<style lang="scss" scoped>
@import '@/assets/style.scss';

.header {
  display: flex;
  justify-content: space-between;
}
</style>
