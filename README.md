# `litnano` – `htmlnano` for `lit`

Minify HTML markup inside [lit](https://lit.dev/) tagged [template literals](https://lit.dev/docs/templates/overview/).

```sh
npm install --save-dev litnano
```

It can be used as a [rollup](https://rollupjs.org/) plugin, [webpack](https://webpack.js.org/) loader or directly operate on any [ESTree](https://github.com/estree/estree)-compliant AST where it modifies
[`TaggedTemplateExpression`](https://github.com/estree/estree/blob/master/es2015.md#taggedtemplateexpression)
nodes using `htmlnano` and `cssnano`.


<details name="usage">
<summary>
<h2>Rollup plugin usage</h2>
</summary>

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
</details>


<details name="usage">
<summary><h2>Webpack loader usage</h2></summary>

A webpack loader is provided out of the box and can be referenced
using the `litnano` entrypoint. It supports soucemaps and can be combined with typescript and terser.

```js
// webpack.config.js
export default {
  …
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [
          { loader: 'litnano' },
          { loader: 'ts-loader' },
        ],
        exclude: /node_modules/
      }
    ]
  },
  optimization: {
    minimize: true
  }
}
```

Note: The loader can also be manually imported via the explicit `litnano/webpack` entrypoint, in case it needs to be extended.
</details>

<details name="usage">
<summary><h2>Advanced usage (AST)</h2></summary>

The litnano lowlevel API is designed to operate on a [ESTree](https://github.com/estree/estree)-compliant AST and modify
[`TaggedTemplateExpression`](https://github.com/estree/estree/blob/master/es2015.md#taggedtemplateexpression)
nodes using `htmlnano`.

```js
import { litnano } from 'litnano'
import { parse } from 'acorn'
import { generate } from 'astring'
import { readFile, writeFile } from 'node:fs/promises'

const code = await readFile('mycomponent.js', 'utf-8')
const ast = parse(code, { ecmaVersion: 2023, sourceType: 'module' })
// You may use "changedNodes" to generate a sourcemap
const changedNodes = await litnano(ast)
await writeFile('mycomponent.min.js', generate(ast))
```

You may pass a concrete `htmlnano` version to be used via the options parameter:

```js
import htmlnano from 'htmlnano'
await litnano(ast, { htmlnano })
```
</details>
