import { simple } from 'acorn-walk'
import posthtml from 'posthtml'
import type { Node, TaggedTemplateExpression, TemplateElement } from 'acorn'
import { Buffer } from 'node:buffer';


export interface Options {
  htmlnano?: typeof import('htmlnano').default,
}

export const litnano = async (ast: Node, opt: Options = {}): Promise<TaggedTemplateExpression[]> => {
  const htmlnano = opt.htmlnano ?? (await import('htmlnano')).default
  const promises: Promise<TaggedTemplateExpression>[] = []
  simple(ast, {
    TaggedTemplateExpression(node) {
      if (node.tag.type !== 'Identifier' || !['html', 'svg', 'css'].includes(node.tag.name)) {
        return
      }
      const isCss = node.tag.name === 'css';
      const task = async (node: TaggedTemplateExpression): Promise<TaggedTemplateExpression> => {
        const placeholder = createPlaceholder(node.quasi.quasis)
        const combined = node.quasi.quasis.map(part => part.value.raw).join(placeholder)

        const propertyReplacer = (map: (name: string) => string) => (tree: posthtml.Node) => {
          tree.walk((node: posthtml.Node): posthtml.Node => {
            if (node && node.attrs && typeof node.attrs === 'object') {
              node.attrs = Object.fromEntries(Object.entries(node.attrs).map(([attrName, attrValue]) => [
                attrName.startsWith('.') ? '.' + map(attrName.substr(1)) : attrName,
                attrValue,
              ]))
            }
            return node
          })
        }

        const processor = posthtml([
          propertyReplacer(name => Buffer.from(name).toString('hex')),
          htmlnano({
            removeAttributeQuotes: true,
            sortAttributes: false,
            sortAttributesWithLists: false,
            normalizeAttributeValues: false,
            collapseWhitespace: 'aggressive',
            minifyCss: {
              preset: [
                'default',
                { cssDeclarationSorter: false }
              ]
            },
          }),
          propertyReplacer(name => Buffer.from(name, 'hex').toString()),
        ])
        const { html } = await processor.process(isCss ? `<style>${combined}</style>` : combined);

        const res = isCss ? html.replace(/^<style>/, '').replace(/<\/style>$/, '') : html;
        const min = splitByPlaceholder(res, placeholder)
        if (min.length !== node.quasi.quasis.length) {
          console.error('HTML could not be minified', { length: node.quasi.quasis.length, combined, html, min })
          throw new Error('HTML could not be minified')
        }
        min.forEach((html, index) => {
          node.quasi.quasis[index].value.raw = html
          node.quasi.quasis[index].value.cooked = html
        })
        return node;
      }
      promises.push(task(node))
    },
  })
  return await Promise.all(promises)
}

/**
 * Based on https://github.com/asyncLiz/minify-html-literals/blob/v1.3.5/src/strategy.ts#L98
 */
function createPlaceholder(parts: TemplateElement[]): string {
  let i = 0, placeholder: string;
  const dash = '-';
  do {
    placeholder = `@template(--template${dash.repeat(++i)}expression)`
  } while (parts.some(part => part.value.raw.includes(placeholder)));

  return placeholder;
}

/**
 * https://github.com/asyncLiz/minify-html-literals/blob/v1.3.5/src/strategy.ts#L185
 */
function splitByPlaceholder(str: string, placeholder: string): string[] {
  const parts = str.split(placeholder)
  // Make the last character (a semicolon) optional. See above.
  if (placeholder.endsWith(';')) {
    const withoutSemicolon = placeholder.substring(0, placeholder.length - 1)
    for (let i = parts.length - 1; i >= 0; i--) {
      parts.splice(i, 1, ...parts[i].split(withoutSemicolon))
    }
  }
  return parts
}
