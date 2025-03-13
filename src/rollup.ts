import { litnano as minify, type Options } from './index.js'
import MagicString from 'magic-string'

export const litnano = (opt: Options) => ({
  name: 'rollup-plugin-litnano',
  async transform(code, id) {
      const ast = this.parse(code)
      let ms: MagicString = null
      try {
        await minify(ast, {
          onUpdate(node, html) {
            ms ??= new MagicString(code)
            ms.overwrite(
              node.start,
              node.end,
              html
            )
          }
        })
      } catch (e) {
        this.error(e)
      }
      return ms === null ? null : {
        code: ms.toString(),
        map: ms.generateMap({
          file: id,
          includeContent: true,
          hires: true,
        }),
      }
    }
  }
)
