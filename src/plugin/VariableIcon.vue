<script>
export default {
  props: [
    'types',
    'type',
    'isArray',
    'size'
  ],
  computed: {
    classes () {
      let ret = 'icon icon-type-' + (this.type || '').replaceAll('/', '-')
      if (this.size) ret = ` size-${this.size}`
      if (this.isArray) ret += ' is-array'
      return ret
    }
  }
}
</script>

<template>
<div
  :title="type"
  :class="classes"
  :style="{
    backgroundColor: types && types[type] ? types[type].color : '#999'
  }"
/>
</template>

<style lang="scss" scoped>
.icon {
  width: 12px;
  height: 12px;
  margin: 4px 0;
  display: inline-block;
  border-radius: 6px;

  &.size-big {
    width: 18px;
    height: 18px;
    border-radius: 9px;
  }

  &.is-array {
    border-radius: 3px !important;
    transform: rotate(45deg);
  }
}
</style>
