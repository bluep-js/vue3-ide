<script>
export default {
  props: ['edge', 'types', 'layout', 'dragSlot'],
  emits: ['deleteMe', 'mouseEnter'],
  data () {
    return {
      path: this.getPath()
    }
  },
  methods: {
    midPoint (a, b) {
      return {
        x: (a.x + b.x) / 2,
        y: (a.y + b.y) / 2
      }
    },
    getPath () {
      if (!this.layout.parts[this.edge.id]) return ''
      const from = this.layout.parts[this.edge.id].from
      const to = this.layout.parts[this.edge.id].to
      let path = 'M ' + from.x + ' ' + from.y
      path += 'C ' + from.x + ' ' + from.y
      path += ', ' + (from.x + 30) + ' ' + from.y
      const mid = this.midPoint(from, to)
      path += ', ' + mid.x + ' ' + mid.y
      path += 'S ' + (to.x - 30) + ' ' + to.y
      path += ', ' + to.x + ' ' + to.y
      return path
    }
  },
  computed: {
    edgeColor () {
      let ftp = null
      const grey = '#999'
      if (this.dragSlot) return grey
      Object.keys(this.types).forEach(ttp => {
        if (this.edge.type.startsWith(ttp)) {
          ftp = ttp
        }
      })
      return ftp ? this.types[ftp].color : grey
    }
  },
  watch: {
    layout: {
      handler () {
        this.path = this.getPath()
      },
      deep: true
    }
  }
}
</script>

<template>
  <path
    :d="path"
    :stroke="edgeColor"
    :stroke-width="2"
    fill="transparent"
    @mouseenter="$emit('mouseEnter')"
  />
</template>
