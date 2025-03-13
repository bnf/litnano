import { litnano as minify, type Options } from './index.js'
import MagicString from 'magic-string'
import type { TaggedTemplateExpression } from 'acorn'
import type { Plugin } from 'rollup'

export const litnano = (opt: Options = {}): Plugin => ({
  name: 'rollup-plugin-litnano',
  async transform(code, id) {
    try {
      const ast = this.parse(code)
      const nodes = await minify(ast);
      if (nodes.length === 0) {
        return null;
      }

      const ms = new MagicString(code)
      for (const node of nodes) {
        for (const templateElement of node.quasi.quasis) {
          ms.update(templateElement.start, templateElement.end, templateElement.value.raw)
        }
      }

      return {
        code: ms.toString(),
        map: ms.generateMap({
          file: id,
          includeContent: true,
          hires: true,
        })
      }
    } catch (e) {
      if (e instanceof Error) {
        this.error(e.message)
        return null;
      }
      throw e
    }
  }
})
