import { litnano } from 'litnano'
import { readFile } from 'fs/promises'
import { parse } from 'acorn'
import { generate } from 'astring'
import { rollup } from 'rollup'
import { litnano as litnanoRollup } from 'litnano/rollup'
import terser from '@rollup/plugin-terser'
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
