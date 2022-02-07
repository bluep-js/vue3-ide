<script>

import { actorCombined } from './graph'

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
      addSelector: '',
      opens: {}
    }
  },
  methods: {
    /**
      Fires emit event to add new element to library
    */
    addSelectorChange () {
      if (this.addSelector === '') return
      if (this.addSelector.startsWith('event::')) {
        const [evv, mod, ev] = this.addSelector.split('::')
        this.$emit('addToLibrary', {
          name: '',
          type: evv,
          module: mod,
          code: ev
        })
        this.addSelector = ''
        return
      }
      if (this.addSelector.startsWith('actor::')) {
        const [act, aid, ev] = this.addSelector.split('::')
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
      Library classes
    */
    libraryClasses () {
      return Object.values(this.libraries[this.currentLibrary].classes || {})
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
            code: `event::${mod.code}::${event.code}`,
            enabled: true
          })
        })
      })
      Object.values(this.actors || {}).forEach(actor => {
        const cmb = actorCombined(actor.id, this.actors, this.modules)
        Object.values(cmb.events || {}).forEach(event => {
          ret.push({
            label: actor.name + '::' + event.name,
            code: `actor::${actor.id}::${event.code}`,
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
      <div class="ml-5">
        <select v-model="addSelector" @change="addSelectorChange" class="panel-input text-dark">
          <option value="">Add new</option>
          <optgroup label="Basic">
            <option value="function">Function</option>
            <option value="class">Class</option>
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
    </div>
    <div class="panel-body panel-body-scrollable">
      <!-- classes -->
      <div
        v-for="cls of libraryClasses"
        :key="cls.code"
        :class="{selected: selectedElement?.code === cls.code}"
      >
        <div class="d-flex-jcb w-100">
          <div class="list-item-text d-flex list-item-class">
            <button @click="opens[cls.code] = !opens[cls.code]" :disabled="!Object.keys(cls.methods || {}).length" class="icon-button button-small">
              <i v-if="opens[cls.code]" :class="icons.chevronDown"></i>
              <i v-else :class="icons.chevronRight"></i>
            </button>
            <button @click="$emit('selectElement', cls)" class="w-100 t-left icon-button button-small">
              <i :class="icons.class + ' ' + icons.fw"></i>
              {{cls.name}}
            </button>
          </div>
          <div class="list-item-controls">
            <button @click="deleteElement(cls)" class="icon-button button-small">
              <i :class="icons.remove" class="trash-icon"></i>
            </button>
          </div>
        </div>
        <div v-if="opens[cls.code]" class="class-methods">
          <div
            v-for="fn of Object.values(cls.methods || {})"
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
            <!--
            <div class="list-item-controls">
              <button @click="deleteElement(fn)" class="icon-button button-small">
                <i :class="icons.remove" class="trash-icon"></i>
              </button>
            </div>
            -->
          </div>
        </div>
      </div>
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

.list-item-class {
  align-items: center;

  button:first-child {
    flex: 0 0 30px;
  }

  button:last-child {
    flex: 0 0 auto;
  }
}

.list-item.selected {
  button {
    font-weight: bold;
  }
}

.class-methods {
  margin-left: 30px;
  margin-top: -5px;
  margin-bottom: 5px;
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
