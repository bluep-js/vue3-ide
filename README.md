# @bluepjs/vue3-ide

Vue3 IDE component for developing blueprints library, executed by `@bluepjs/vm`

# Installation
```
npm install -s @bluepjs/vue3-ide
```

# Ussage

Add IDE module to your Vue app
```
// main.js
// ...
import bluep from '@bluepjs/vue3-ide'
// ...
createApp(app)
  .use(bluep)
// ...
```

Your application should manage "communication" with Virtual Machine to get VM possibilities (libraries, actors, types, nodes and modules). Check (@bluepjs/example)[https://github.com/bluep-js/example] for integration example.

Integrate Editor into page:
```
    <BluepJsEditor
      :height="'100%'"
      :types="vm.types"
      :nodes="vm.nodes"
      :modules="vm.modules"
      :actors="vm.actors"
      :libraries="vm.libraries"
      :options="editorOptions"
      @save="onSave"
      @run="onRun"
      @select="onSelect"
    />
```

`vm` object provided by `Vm::ideData()` method

### Options

Options object used to configure editor icons and starting page, for example:
```
  computed: {
    editorOptions () {
      const last = localStorage.getItem('bluep/select')
      let select = null
      if (last) {
        try {
          select = JSON.parse(last)
        } catch (err) {
          localStorage.removeItem('bluep/select')
          select = null
        }
      }
      return {
        icons: {
          enum: 'bi-file-text',
          struct: 'bi-file-medical',
          function: 'bi-file-code',
          class: '',
          library: 'bi-book',
          event: 'bi-bell',
          view: 'bi-eye',
          add: 'bi-plus',
          remove: 'bi-trash',
          save: 'bi-save',
          run: 'bi-play',
          close: 'bi-x',
          fw: ''
        },
        select
      }
    }
  }
```

 - `icons` - used "i class" style. Without icons some buttons right now are not visible (has no text, will be fixed in future)
 - `select` - object recieved on `@select` event to start editor with required element open

### Events

 - `save` - "SAVE" button clicked. `$event` is updated library
 - `run` - "RUN" buttn clicked. $event contains information about library and function codes to run
 - `select` - fires when some element is selected to edit

# Documentation (under development)

https://bluepjs.readthedocs.io/en/latest/

# Roadmap

 Templated fields, dynamic inputs/outputs, classes and OOP support, libraries support (use/import/export)

# Local Development

## Project setup
```
npm install
```

### Compiles and hot-reloads for development
```
npm run serve
```

Dowsn't have any VM to get types/nodes/libraries/etc

### Compiles and minifies for production
```
npm run build
```

### Lints and fixes files
```
npm run lint
```

### PR

Please, into `dev` branch
