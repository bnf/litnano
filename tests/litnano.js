import { litnano } from 'litnano'
import { readFile } from 'fs/promises'
import { parse } from 'acorn'
import { generate } from 'astring'
import { rollup } from 'rollup'
import { litnano as litnanoRollup } from 'litnano/rollup'
import terser from '@rollup/plugin-terser'
import webpack from 'webpack'
import test from 'ava'

test('[ESM] Minify from acorn', async (assert) => {
  const code = await readFile(new URL('./fixtures/motion-slide.js', import.meta.url), 'utf-8')
  const expected = await readFile(new URL('./fixtures/motion-slide.min.js', import.meta.url), 'utf-8')
  const ast = parse(code, { ecmaVersion: 2023, sourceType: 'module' })
  await litnano(ast)
  assert.is(
    generate(ast),
    expected,
    'Minimizes html and css in literals',
  )
})

test('[ESM] Minify via rollup and terser', async (assert) => {
  const expected = await readFile(new URL('./fixtures/motion-slide.min.tersed.js', import.meta.url), 'utf-8')

  const bundle = await rollup({
    input: new URL('./fixtures/motion-slide.js', import.meta.url).pathname,
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

test('[ESM] Minify via webpack and terser', async (assert) => {
  const expected = await readFile(new URL('./fixtures/motion-slide.webpack.expected.js', import.meta.url), 'utf-8')

  const compiler = webpack({
    mode: 'production',
    //devtool: 'inline-source-map',
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
      path: new URL('./fixtures/', import.meta.url).pathname,
    },
    module: {
      rules: [{
        test: /\.js$/,
        use: [{ loader: 'litnano/webpack' }]
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

  const code = await readFile(new URL('./fixtures/motion-slide.webpack.js', import.meta.url), 'utf-8')
  assert.is(
    code,
    expected,
    'Minimizes html and css in literals via webpack',
  )
})
