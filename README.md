# `litnano` – `htmlnano` for `lit`

Minify HTML markup inside lit tagged template literals.

## Usage

This library is designed to operate on a [ESTree](https://github.com/estree/estree)-compliant AST and modify
[`TaggedTemplateExpression`](https://github.com/estree/estree/blob/master/es2015.md#taggedtemplateexpression)
nodes using `htmlnano`.

```js
import { litnano } from 'litnano'
import { parse } from 'acorn'
import { generate } from 'astring'
import { readFile, writeFile } from 'node:fs/promises'

const code = await readFile('mycomponent.js', 'utf-8')
const ast = parse(code, { ecmaVersion: 2023, sourceType: 'module' })
await litnano(ast)
await writeFile('mycomponent.min.js', generate(ast))
```

## Advanced usage

You may pass a concrete `htmlnano` version to be used via the options parameter:

```js
import htmlnano from 'htmlnano'
await litnano(ast, { htmlnano })
```

## Rollup plugin usage

A rollup plugin is provided via the `litnano/rollup` entrypoint. It
supports soucemaps and can be combined with `@rollup/plugin-terser`.

```js
// rollup.config.mjs
import { litnano } from 'litnano/rollup'
import terser from '@rollup/plugin-terser'

export default {
  input: '…',
  output: {
    file: '…',
    format: 'es',
    sourcemap: true,
  },
  plugins: [
    litnano(),
    terser({ ecma: 2020, module: true })
  ],
}
```
