import MagicString, { type SourceMap } from 'magic-string'
import { litnano as minify, type Options } from './index.js'
import type { Node, TaggedTemplateExpression } from 'acorn'

export async function process(
  source: string,
  ast: Node,
  options: Options,
  file: string,
  sourceMap: boolean = true,
): Promise<{ code: string | null, map?: SourceMap }> {
  const nodes = await minify(ast, options)
  if (nodes.length === 0) {
    return { code: null }
  }

  const ms = new MagicString(source)
  for (const node of nodes) {
    for (const templateElement of node.quasi.quasis) {
      if (templateElement.start === templateElement.end) {
        ms.appendLeft(templateElement.start, templateElement.value.raw)
      } else {
        ms.update(templateElement.start, templateElement.end, templateElement.value.raw)
      }
    }
  }
  const code = ms.toString()

  if (sourceMap) {
    return {
      code,
      map: ms.generateMap({
        file,
        includeContent: true,
        hires: true,
      })
    }
  }

  return { code }
}
