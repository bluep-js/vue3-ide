<script>

export default {
  props: {
    libraries: {
      type: Object,
      default: () => ({})
    },
    selectedElement: {
      type: Object,
      default: () => null
    },
    currentLibrary: {
      type: String,
      default: ''
    },
    isSaved: {
      type: Boolean,
      default: true
    },
    icons: {
      type: Object,
      default: () => null
    },
    canRun: {
      type: Boolean,
      default: true
    }
  },
  emits: [
    'selectLibrary',
    'createLibrary',
    'viewLibrary',
    'saveClick',
    'runClick'
  ],
  computed: {
    librariesList () {
      return Object.keys(this.libraries || {}).map(code => {
        return {
          code,
          name: this.libraries[code].name
        }
      })
    },
    currentLibraryName () {
      if (this.selectedElement.type === 'library') {
        return this.selectedElement.name
      }
      return this.libraries[this.selectedElement.library].name
    }
  },
  methods: {
    librarySelectorChange (e) {
      const val = e.target.value
      if (val === '') return
      if (val === 'add') {
        const name = prompt('Set new library name:')
        const libs = Object.keys(this.libraries || {}).map(code => this.libraries[code].name)
        if (libs.includes(name)) {
          alert('This library already exists')
          return
        }
        if (name && name.length) this.$emit('createLibrary', name)
        return
      }
      this.$emit('selectLibrary', val)
    }
  }
}
</script>

<template>
<div class="topbar-wrapper bluep-panel-wrapper">
  <div class="library-selector">
    <span>Library:</span>
    <select @change="librarySelectorChange" class="panel-input text-dark">
      <option
        value=""
        v-if="!currentLibrary"
      >Select</option>
      <option
        v-for="lib of librariesList"
        :key="lib.code"
        :value="lib.code"
        :selected="currentLibrary === lib.code"
      >{{lib.name}}</option>
      <option value="add" disabled>Create New</option>
    </select>
    <button :disabled="!currentLibrary" @click="$emit('viewLibrary')" class="icon-button">
      <i :class="icons.view + ' ' + icons.fw"></i>
    </button>
  </div>
  <div class="current-path">
    <div class="selected-element-path" v-if="selectedElement">
      <i :class="icons.library + ' ' + icons.fw"></i>
      <span style="margin-left: 5px;">{{currentLibraryName}}</span>
      <span v-if="selectedElement.type === 'function'">
        <b>|</b>
        <i v-if="!selectedElement.event" :class="icons.function + ' ' + icons.fw"></i>
        <i v-else :class="icons.event + ' ' + icons.fw"></i>
        <span style="margin-left: 5px;">{{selectedElement.name}}</span>
      </span>
      <span v-if="selectedElement.type === 'struct'">
        <b>|</b>
        <i :class="icons.struct + ' ' + icons.fw"></i>
        <span style="margin-left: 5px;">{{selectedElement.name}}</span>
      </span>
      <span v-if="selectedElement.type === 'enum'">
        <b>|</b>
        <i :class="icons.enum + ' ' + icons.fw"></i>
        <span style="margin-left: 5px;">{{selectedElement.name}}</span>
      </span>
    </div>
  </div>
  <div class="controls">
    <button class="icon-button" :disabled="isSaved" @click="$emit('saveClick')"><i :class="icons.save + ' ' + icons.fw"></i> Save</button>
    <button
      v-if="canRun && selectedElement?.type === 'function' && !selectedElement?.event"
      class="icon-button"
      :disabled="!isSaved"
      @click="$emit('runClick')"
    ><i :class="icons.run + ' ' + icons.fw"></i> Run</button>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.topbar-wrapper {
  display: flex;
  align-content: stretch;
}
.library-selector {
  width: $panelWidth - $panelPadding*2;
  max-width: $panelWidth - $panelPadding*2;
  flex-grow: 1;
  text-align: left;
  display: flex;
  align-items: stretch;

  select {
    width: 100%;
    margin: 0;
    margin-left: $panelPadding;
    color: $textColor;

    option {
      color: #333;

      &:disabled {
        color: #aaa;
      }
    }
  }
}
.current-path {
  flex-grow: 10;
  text-align: left;
  padding: 0 $panelPadding;

  b {
    margin: 0 $panelPadding;
  }
}
.controls {
  width: $panelWidth;
  max-width: $panelWidth;
  flex-grow: 1;
  text-align: right;

  button {
    margin-left: $panelPadding;
    min-width: $panelTextSize * 5;
  }
}

</style>
