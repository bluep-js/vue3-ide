<script>
import VariableIcon from './VariableIcon.vue'

export default {
  name: 'PanelVariableButton',
  components: { VariableIcon },
  props: ['variable', 'types', 'icons', 'withCode', 'withAccess', 'withSource', 'noRemove', 'noClick'],
  emits: ['click', 'remove']
}
</script>

<template>
  <div
    class="variable"
  >
    <button :disabled="!!noClick" @click="$emit('click', variable.code)" class="icon-button variable-button">
      <div>
        <span v-if="withAccess">[{{variable.access}}]</span>
        <VariableIcon
          :types="types"
          :type="variable.type"
          :isArray="variable.isArray"
          :class="{ 'ml-5': !!withAccess }"
        />
        <span class="ml-5">{{variable.name}}<sup v-if="variable.isArray">{{variable.isArray}}</sup></span>
        <span class="ml-5" v-if="!!withCode">
          [{{variable.code}}]
        </span>
      </div>
    </button>
    <span v-if="!!withSource">
      [{{variable.source.libraryName}}::{{variable.source.name}}]
    </span>
    <div v-if="!noRemove">
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

  sup {
    font-size: 60%;
  }
}

</style>
