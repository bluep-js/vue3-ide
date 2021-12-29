<script>
import { jclone } from './utils.js'

export default {
  props: [
    'library', // library
    'icons'
  ],
  emits: [
    'updateLibrary',
    'deleteLibrary'
  ],
  data () {
    const opts = jclone(this.library.options)
    return {
      code: this.library.code,
      name: this.library.name,
      options: opts,
      saved: true
    }
  },
  methods: {
    updateLibrary () {
      // console.log('upd', this.name, this.options)
    },
    deleteLibrary () {
      if (!confirm(`Delete library <${this.name}? All library content will be lost!`)) return
      this.$emit('deleteLibrary', this.code)
    }
  },
  computed: {
    saveRequire () {
      return !this.saved
    },
    notDeletable () {
      return this.library.options.deleteable === false
    }
  },
  watch: {
    library (next) {
      this.code = next.code
      this.name = next.name
      this.options = jclone(next.options)
      this.saved = true
    }
  }
}
</script>

<template>
<div class="library-properties-wrapper">
  <div class="bluep-panel-wrapper">
    <div class="bluep-panel">
      <div class="panel-header">
        Library properties
      </div>
      <div class="panel-body">
        <div class="library-code mt-1r mb-2">
          <label>Code</label>
          <input class="text-dark panel-input" type="text" disabled v-model="code" @update:modelValue="saved = false"/>
        </div>
        <div class="library-name mb-1r">
          <label>Name</label>
          <input class="text-dark panel-input" type="text" :disabled="name === 'Default'" v-model="name" @update:modelValue="saved = false"/>
        </div>
        <div class="library-options">Options</div>
        <div class="controlls mt-1r">
          <button class="outline-button mr-1r" :disabled="!saveRequire" @click="updateLibrary">
            <i :class="icons.save"></i>
            <span class="ml-1r">Update</span>
          </button>
          <button class="outline-button" v-if="!notDeletable" @click="deleteLibrary">
            <i :class="icons.remove"></i>
            <span class="ml-1r">Delete</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.controls {
  display: flex;
  align-content: space-around;
}

.library-properties-wrapper {
  text-align: left;
  padding: $panelPadding;
}
label {
  width: 100px;
  margin-right: $panelPadding * 2;
}
input {
  color: $textColor;

  &:disabled {
    color: darken($textColor, 40%);
  }
}
</style>
