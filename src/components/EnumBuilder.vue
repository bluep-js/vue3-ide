<script>
import { v4 as uuid } from 'uuid'

export default {
  name: 'EnumBuilder',
  props: [
    'libraries',
    'types',
    'icons',
    'currentLibrary',
    'modelValue'
  ],
  emits: ['update:modelValue'],
  data () {
    return {
      enumData: JSON.parse(JSON.stringify(this.modelValue)),
      saved: true
    }
  },
  methods: {
    addValue () {
      const code = uuid()
      this.enumData.values[code] = 'Option'
      this.saved = false
    },
    delValue (vcode) {
      delete this.enumData.values[vcode]
      this.saved = false
    },
    updateEnum () {
      this.$emit('update:modelValue', this.enumData)
      this.saved = true
    }
  },
  computed: {
    nameError () {
      return this.enumData.name === '' || Object.values(this.libraries[this.currentLibrary].enums)
        .reduce((acc, enm) => acc || (enm.code !== this.enumData.code && enm.name === this.enumData.name), false)
    }
  },
  watch: {
    modelValue: {
      deep: true,
      handler (next) {
        this.enumData = JSON.parse(JSON.stringify(next))
        this.saved = true
      }
    }
  }
}
</script>

<template>
<div class="bluep-panel-wrapper text-left">
  <div class="bluep-panel">
    <div class="panel-header">
      Enum properties
    </div>
    <div class="panel-body">
      <div class="mt-2r mb-2">
        <label>Code</label>
        <input class="text-dark panel-input" type="text" disabled v-model="enumData.code"/>
      </div>
      <div class="mb-2r">
        <label>Name</label>
        <input class="text-dark panel-input" type="text" v-model="enumData.name" @update:modelValue="saved = false"/>
        <blockquote v-if="nameError" class="danger">
          <i>Exists or empty</i>
        </blockquote>
      </div>
    </div>
    <div class="panel-header">
      Values <button @click="addValue()" class="icon-button button-small"><i :class="icons.add"></i></button>
    </div>
    <div class="panel-body">
      <div
        v-for="vcode of Object.keys(enumData.values)"
        :key="vcode"
        class="mb-2"
      >
        <div class="d-flex">
          <input class="text-dark panel-input" type="text"  v-model="enumData.values[vcode]" @update:modeValue="saved = false"/>
          <button class="icon-button" @click="delValue(vcode)">
            <i :class="icons.remove"></i>
          </button>
        </div>
      </div>
      <div class="mt-2r">
        <button class="outline-button" :disabled="saved || nameError" @click="updateEnum()">
          <i :class="icons.save"></i>
          <span class="ml-1r">Update</span>
        </button>
      </div>
    </div>
  </div>
</div>

</template>

<style lang="scss" scoped>
@import '@/assets/style.scss';
</style>
