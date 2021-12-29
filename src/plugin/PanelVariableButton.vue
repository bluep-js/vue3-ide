<script>
import VariableIcon from './VariableIcon.vue'

export default {
  name: 'PanelVariableButton',
  components: { VariableIcon },
  props: ['variable', 'types', 'icons', 'withCode'],
  emits: ['click', 'remove']
}
</script>

<template>
  <div
    class="variable"
  >
    <button @click="$emit('click', variable.code)" class="icon-button variable-button">
      <div>
        <VariableIcon
          :types="types"
          :type="variable.type"
          :isArray="variable.isArray"
        />
        <span class="ml-5">{{variable.name}}</span>
        <span class="ml-5" v-if="!!withCode">
          [{{variable.code}}]
        </span>
      </div>
    </button>
    <div>
      <button @click="$emit('remove', variable.code)" class="icon-button">
        <i :class="icons.remove"></i>
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import './style.scss';
.variable {
  display: flex;
  justify-content: space-between;
  align-content: stretch;
}

.variable-button {
  flex-grow: 1;
  text-align: left;
}

</style>
