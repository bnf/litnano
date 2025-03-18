const { litnano } = require('litnano')
const { readFile } = require('fs/promises')
const { parse } = require('acorn')
const { generate } = require('astring')
const { rollup } = require('rollup')
const { litnano: litnanoRollup } = require('litnano/rollup')
const terser = require('@rollup/plugin-terser')
const webpack = require('webpack')
const test = require('ava')

test('[CJS] Minify from acorn', async (assert) => {
  const code = await readFile(new URL('./fixtures/motion-slide.js', 'file://' + __filename), 'utf-8')
  const expected = await readFile(new URL('./fixtures/motion-slide.min.js', 'file://' + __filename), 'utf-8')
  const ast = parse(code, { ecmaVersion: 2023, sourceType: 'module' })
  await litnano(ast)
  assert.is(
    generate(ast),
    expected,
    'Minimizes html and css in literals',
  )
})

test('[CJS] Minify via rollup and terser', async (assert) => {
  const expected = await readFile(new URL('./fixtures/motion-slide.min.tersed.js', 'file://' + __filename), 'utf-8')

  const bundle = await rollup({
    input: new URL('./fixtures/motion-slide.js', 'file://' + __filename).pathname,
    external: [
      'lit',
      'lit/directives/class-map.js',
      '@lit-labs/motion',
    ],
    plugins: [
      litnanoRollup(),
      terser({ ecma: 2020, module: true }),
    ],
  })

  const { output } = await bundle.generate({
    file: '-',
    format: 'es',
    sourcemap: true,
  })

  assert.is(
    output[0].code,
    expected,
    'Minimizes html and css in literals via rollup',
  )
})

test('[CJS] Minify via webpack and terser', async (assert) => {
  const expected = await readFile(new URL('./fixtures/motion-slide.webpack.expected.js', 'file://' + __filename), 'utf-8')

  const webpack = require('webpack');
  const compiler = webpack({
    mode: 'production',
    devtool: false,
    entry: {
      'motion-slide': './tests/fixtures/motion-slide.js',
    },
    experiments: {
      outputModule: true,
    },
    target: 'es2020',
    externals: {
      'lit': 'lit',
      'lit/directives/class-map.js': 'lit/directives/class-map.js',
      '@lit-labs/motion': '@lit-labs/motion',
    },
    output: {
      module: true,
      filename: '[name].webpack.js',
      path: new URL('./fixtures/', 'file://' + __filename).pathname,
    },
    module: {
      rules: [{
        test: /\.js$/,
        use: [
          { loader: 'litnano' }
        ]
      }]
    },
    optimization: {
      minimize: true,
    }
  })

  await new Promise((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err)
      } else {
        compiler.close(closeErr => closeErr ? reject(closeErr) : resolve())
      }
    })
  })


  const code = await readFile(new URL('./fixtures/motion-slide.webpack.js', 'file://' + __filename), 'utf-8')
  assert.is(
    code,
    expected,
    'Minimizes html and css in literals via webpack',
  )
})
