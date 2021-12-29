<script>

export default {
  props: [
    'libraries',
    'modules',
    'actors',
    'currentLibrary',
    'selectedElement',
    'icons'
  ],
  emits: [
    'addToLibrary',
    'selectElement',
    'deleteElement'
  ],
  data () {
    return {
      addSelector: ''
    }
  },
  methods: {
    /**
      Fires emit event to add new element to library
    */
    addSelectorChange () {
      if (this.addSelector === '') return
      if (this.addSelector.startsWith('event/')) {
        const [evv, mod, ev] = this.addSelector.split('/')
        this.$emit('addToLibrary', {
          name: '',
          type: evv,
          module: mod,
          code: ev
        })
        this.addSelector = ''
        return
      }
      if (this.addSelector.startsWith('actor/')) {
        const [act, aid, ev] = this.addSelector.split('/')
        if (act !== 'actor') {
          return
        }
        this.$emit('addToLibrary', {
          name: '',
          type: 'event',
          actor: aid,
          code: ev
        })
        this.addSelector = ''
        return
      }
      this.$emit('addToLibrary', { name: '', type: this.addSelector })
      this.addSelector = ''
    },
    /**
      Fires emit event to delete element from library
    */
    deleteElement (el) {
      if (!confirm(`Delete <${el.type} ${el.name}>?`)) return
      this.$emit('deleteElement', el)
    },
    /**
      Check if {code} event has handler function
    */
    hasEventFunction (code) {
      return !!this.libraryFunctions.find(fn => fn.event === code)
    }
  },
  computed: {
    /**
      Library enums
    */
    libraryEnums () {
      return Object.values(this.libraries[this.currentLibrary].enums || {})
    },
    /**
      Library structs
    */
    libraryStructs () {
      return Object.values(this.libraries[this.currentLibrary].structs || {})
    },
    /**
      Library functions
    */
    libraryFunctions () {
      return Object.values(this.libraries[this.currentLibrary].functions || {})
    },
    /**
      Library events
    */
    eventsList () {
      const ret = []
      Object.values(this.modules).forEach(mod => {
        Object.values(mod.events || {}).forEach(event => {
          ret.push({
            label: event.name,
            code: `event/${mod.code}/${event.code}`,
            enabled: true
          })
        })
      })
      Object.values(this.actors || {}).forEach(actor => {
        Object.values(actor.events || {}).forEach(event => {
          ret.push({
            label: actor.name + '::' + event.name,
            code: `actor/${actor.id}/${event.code}`,
            enabled: true
          })
        })
      })
      return ret
    }
  }
}
</script>

<template>
<div class="bluep-panel-wrapper">
  <div class="bluep-panel">
    <div class="panel-header">
      <span class="title">Content</span>
      <select v-model="addSelector" @change="addSelectorChange" class="panel-input text-dark">
        <option value="">Add new</option>
        <optgroup label="Basic">
          <option value="function">Function</option>
          <option value="class" disabled>Class</option>
          <option value="struct">Struct</option>
          <option value="enum">Enum</option>
        </optgroup>
        <optgroup label="Events" v-if="eventsList.length && libraries[currentLibrary].name === 'Default'">
          <option
            v-for="ev of eventsList"
            :key="ev.code"
            :value="ev.code"
            :disabled="!ev.enabled"
          >
            {{ev.label}}
          </option>
        </optgroup>
      </select>
    </div>
    <div class="panel-body">
      <!-- functions -->
      <div
        v-for="fn of libraryFunctions"
        :key="fn.code"
        class="list-item"
        :class="{selected: selectedElement?.code === fn.code}"
      >
        <div class="list-item-text">
          <button @click="$emit('selectElement', fn)" class="icon-button button-small">
            <i :class="icons.function + ' ' + icons.fw" v-if="!fn.event"></i>
            <i :class="icons.event + ' ' + icons.fw" v-else></i>
            {{fn.name}}
          </button>
        </div>
        <div class="list-item-controls">
          <button @click="deleteElement(fn)" class="icon-button button-small">
            <i :class="icons.remove" class="trash-icon"></i>
          </button>
        </div>
      </div>
      <!-- structs -->
      <div
        v-for="fn of libraryStructs"
        :key="fn.code"
        class="list-item"
        :class="{selected: selectedElement?.code === fn.code}"
      >
        <div class="list-item-text">
          <button @click="$emit('selectElement', fn)" class="icon-button button-small">
            <i :class="icons.struct + ' ' + icons.fw"></i>
            {{fn.name}}
          </button>
        </div>
        <div class="list-item-controls">
          <button @click="deleteElement(fn)" class="icon-button button-small">
            <i :class="icons.remove" class="trash-icon"></i>
          </button>
        </div>
      </div>
      <!-- /structs -->
      <!-- enums -->
      <div
        v-for="fn of libraryEnums"
        :key="fn.code"
        class="list-item"
        :class="{selected: selectedElement?.code === fn.code}"
      >
        <div class="list-item-text">
          <button @click="$emit('selectElement', fn)" class="icon-button button-small">
            <i :class="icons.enum + ' ' + icons.fw"></i>
            {{fn.name}}
          </button>
        </div>
        <div class="list-item-controls">
          <button @click="deleteElement(fn)" class="icon-button button-small">
            <i :class="icons.remove" class="trash-icon"></i>
          </button>
        </div>
      </div>
      <!-- /enums -->
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
@import './style.scss';

.icon {
  fill: $textColor;
}

.trash-icon {
  fill: #c33;
}

.list-item.selected {
  button {
    font-weight: bold;
  }
  svg.list-item-icon {
    fill: #2ee838;
  }
}

select {
  width: 100%;
  margin: 0;
  height: fit-content;
  margin-left: $panelPadding;
  color: $textColor;

  optgroup {
    color: #333;
  }

  option {
    color: #333;

    &:disabled {
      color: #aaa;
    }
  }
}
</style>
