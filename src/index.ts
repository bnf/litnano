import { simple } from 'acorn-walk'
import type { Node, TaggedTemplateExpression, TemplateElement } from 'acorn'

export interface Options {
  htmlnano?: typeof import('htmlnano').default,
  onUpdate?: (node: TemplateElement, html: string) => void,
}

export const litnano = async (ast: Node, opt: Options = {}): Promise<void> => {
  const htmlnano = opt.htmlnano ?? (await import('htmlnano')).default
  const promises: Promise<void>[] = []
  simple(ast, {
    TaggedTemplateExpression(node) {
      if (node.tag.type !== 'Identifier' || !['html', 'svg', 'css'].includes(node.tag.name)) {
        return
      }
      const isCss = node.tag.name === 'css';
      const task = async (node: TaggedTemplateExpression): Promise<void> => {
        const placeholder = createPlaceholder(node.quasi.quasis)
        const combined = node.quasi.quasis.map(part => part.value.raw).join(placeholder)
        const { html } = await htmlnano.process(isCss ? `<style>${combined}</style>` : combined)
        const res = isCss ? html.replace(/^<style>/, '').replace(/<\/style>$/, '') : html;
        const min = splitByPlaceholder(res, placeholder)
        if (min.length !== node.quasi.quasis.length) {
          console.error('HTML could not be minified', { length: node.quasi.quasis.length, combined, html, min })
          throw new Error('HTML could not be minified')
        }
        min.forEach((html, index) => {
          opt.onUpdate?.(node.quasi.quasis[index], html);
          node.quasi.quasis[index].value.raw = html
          node.quasi.quasis[index].value.cooked = html
        })
      }
      promises.push(task(node))
    },
  })
  await Promise.all(promises)
}

/**
 * Based on https://github.com/asyncLiz/minify-html-literals/blob/v1.3.5/src/strategy.ts#L98
 */
function createPlaceholder(parts: TemplateElement[]): string {
  // Using @ and (); will cause the expression not to be removed in CSS.
  // However, sometimes the semicolon can be removed (ex: inline styles).
  // In those cases, we want to make sure that the HTML splitting also
  // accounts for the missing semicolon.
  const suffix = '();'
  let placeholder = '@template_expression'
  while (parts.some(part => part.value.raw.includes(placeholder + suffix))) {
    placeholder += '_'
  }
  return placeholder + suffix
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
