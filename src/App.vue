<script>
import Editor from './components/Editor.vue'

export default {
  name: 'App',
  components: {
    Editor
  }
}
</script>

<template>
  <Editor/>
</template>

<style lang="scss">
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
