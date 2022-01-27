<script>
import { waitFor } from './utils'

export default {
  props: [
    'types',
    'graph',
    'nodes',
    'filter',
    'posX',
    'posY'
  ],
  emits: [
    'addNode'
  ],
  data () {
    const tree = {}
    this.nodes.forEach(node => {
      if (node.addable === false) return
      const list = node.code.split('/')
      // console.log(list)
      const cat = list.shift()
      if (list.length === 1) {
        if (!tree[cat]) tree[cat] = {}
        tree[cat][list[0]] = {
          name: node.name,
          code: node.code,
          childs: null
        }
      } else {
        const subcat = list.shift()
        const subcatNode = this.nodes.find(node => node.code === `${cat}/${subcat}`)
        // console.log('subcat', subcat)
        if (!tree[cat]) tree[cat] = {}
        if (!tree[cat][subcat]) {
          tree[cat][subcat] = {
            code: subcatNode.code,
            name: subcatNode.name,
            childs: {}
          }
        }
        tree[cat][subcat].childs[list.join('/')] = {
          code: node.code,
          name: node.name,
          childs: null
        }
      }
    })
    return {
      tree,
      states: {},
      search: ''
    }
  },
  async created () {
    await waitFor(0)
    this.$refs.search.focus()
  },
  computed: {
    filteredTree () {
      const next = {}
      Object.keys(this.tree).forEach(cat => {
        Object.keys(this.tree[cat]).forEach(catel => {
          if (!this.tree[cat][catel].childs) {
            if (this.nodeFiltered(this.tree[cat][catel])) {
              if (!next[cat]) next[cat] = {}
              next[cat][catel] = this.tree[cat][catel]
            }
          } else {
            Object.keys(this.tree[cat][catel].childs).forEach(subel => {
              if (this.nodeFiltered(this.tree[cat][catel].childs[subel])) {
                if (!next[cat]) next[cat] = {}
                if (!next[cat][catel]) {
                  next[cat][catel] = {
                    name: this.tree[cat][catel].name,
                    code: this.tree[cat][catel].code,
                    childs: {}
                  }
                }
                next[cat][catel].childs[subel] = this.tree[cat][catel].childs[subel]
              }
            })
          }
        })
      })
      return next
    }
  },
  watch: {
    search (next) {
      if (next === '') this.states = {}
    }
  },
  methods: {
    nodeFiltered (node) {
      if (!this.search || !this.search.length) return node
      if (node.name.includes(this.search) || node.code.includes(this.search)) return node
      return null
    },
    toggleCat (code) {
      // console.log('toggle', code)
      this.states[code] = !this.states[code]
    },
    addNode (code) {
      // console.log('addNode', code)
      this.$emit('addNode', code)
    }
  }
}
</script>

<template>
<div class="context-menu" @wheel.stop :style="{
  top: posY + 'px',
  left: posX + 'px'
}">
  <div class="caption">add node</div>
  <input ref="search" class="search text-dark" type="text" placeholder="search" v-model="search"/>
  <div class="menu-inner">
    <div v-for="cat of Object.keys(filteredTree)" :key="cat">
      <button class="cat-button" @click.stop.prevent="toggleCat(cat)">
        <span v-if="states[cat]" class="state-icon">-</span>
        <span v-else class="state-icon">+</span>
        {{cat}}
      </button>
      <ul v-if="states[cat]">
        <li v-for="catel of Object.keys(filteredTree[cat])" :key="catel">
          <button
            v-if="!filteredTree[cat][catel].childs"
            class="fn-button"
            @click="addNode(filteredTree[cat][catel].code)"
          >{{filteredTree[cat][catel].name}}</button>
          <div v-else>
            <button class="cat-button" @click.stop.prevent="toggleCat(cat+'/'+catel)">
              <span v-if="states[cat+'/'+catel]" class="state-icon">-</span>
              <span v-else class="state-icon">+</span>
              {{catel}}
            </button>
            <ul v-if="states[cat+'/'+catel]">
              <li v-for="fn of Object.keys(filteredTree[cat][catel].childs)" :key="fn">
                <button class="fn-button" @click="addNode(filteredTree[cat][catel].childs[fn].code)">
                  {{filteredTree[cat][catel].childs[fn].name}}
                </button>
              </li>
            </ul>
          </div>
        </li>
      </ul>
    </div>
  </div>
</div>
</template>

<style lang="scss">
@import './style.scss';

.context-menu {
  position: absolute;
  border: 1px solid #aaa;
  padding: 5px;
  border-radius: 5px;
  color: $textColor;
  z-index: 5;
  min-width: 150px;
  max-height: 300px;
  background-color: rgba($bgColor, 75%);

  .caption {
    font-size: 80%;
    font-weight: bold;
    text-align: left;
  }

  input.search {
    height: $graphTextSize * 2;
    line-height: $graphTextSize * 2;
    font-size: $graphTextSize;
    margin: 0;
    color: $textColor;
  }

  .menu-inner {
    overflow-y: auto;
    max-height: 240px;
    margin-top: 5px;
  }

  ul {
    margin: 0;
    padding: 0;

    li {
      margin: 0;
      padding: 0;
      padding-left: 15px;
      list-style: none;
    }
  }
}

.cat-button {
  width: 100%;
  background: none;
  border: 0px;
  color: #fff;
  text-align: left;
  margin-bottom: 2px;
  height: 1.5rem;
  line-height: 1.5rem;
}

.fn-button {
  width: 100%;
  background: none;
  border: 0px;
  color: #fff;
  text-align: left;
  margin-bottom: 2px;
  height: 1.5rem;
  line-height: 1.5rem;
}

</style>
