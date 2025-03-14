const { litnano } = require('litnano')
const { readFile } = require('fs/promises')
const { parse } = require('acorn')
const { generate } = require('astring')
const { rollup } = require('rollup')
const { litnano: litnanoRollup } = require('litnano/rollup')
const terser = require('@rollup/plugin-terser')
const test = require('ava')

test('[CJS] Minify from acorn', async (assert) => {
  console.log('FOO', __filename)
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
