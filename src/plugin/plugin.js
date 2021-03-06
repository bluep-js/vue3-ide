// Import vue component
import BluepJsEditor from './Editor.vue'
import ValueWidget from './ValueWidget'

// Declare install function executed by Vue.use()
export function install (Vue, options) {
  if (install.installed) return
  install.installed = true
  const name = options && options.component ? options.component : 'BluepJsEditor'
  const vwname = options && options.valueWidget ? options.valueWidget : 'BluepJsValueWidget'
  Vue.component(name, BluepJsEditor)
  Vue.component(vwname, ValueWidget)
}

// Create module definition for Vue.use()
const plugin = {
  install
}

// Auto-install when vue is found (eg. in browser via <script> tag)
let GlobalVue = null
if (typeof window !== 'undefined') {
  GlobalVue = window.Vue
} else if (typeof global !== 'undefined') {
  GlobalVue = global.Vue
}
if (GlobalVue) {
  GlobalVue.use(plugin)
}

// To allow use as module (npm/webpack/etc.) export component
export default plugin
