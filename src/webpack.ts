import { process } from './process.js'
import MagicString, { type SourceMap } from 'magic-string'
import type { Options as BaseOptions } from './index.js'
import type { TaggedTemplateExpression, Options as AcornOptions } from 'acorn'
import type { LoaderDefinitionFunction } from 'webpack';

export interface Options extends BaseOptions {
  acorn?: AcornOptions,
}

async function doProcess(
  source: string,
  options: Options,
  file: string,
  sourceMap: boolean
): Promise<{ code: string | null, map?: SourceMap }> {
  const { parse } = await import('acorn');
  const ast = parse(source, {
    ecmaVersion: 2025,
    sourceType: 'module',
    ...(options.acorn || {})
  })
  return await process(source, ast, options, file, sourceMap);
}

export default (function(source: string): void {
  const callback = this.async()

  doProcess(source, this.getOptions(), this.resourcePath, this.sourceMap ? true : false)
    .then(({ code, map }) => callback(null, code ?? source, map))
    .catch(callback)
} as LoaderDefinitionFunction<Options>);
