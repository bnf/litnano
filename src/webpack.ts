import MagicString, { type SourceMap as MagicStringSourceMap } from 'magic-string'
import { parse, Options as AcornOptions } from 'acorn'
import { process } from './process.js'

import type { LoaderDefinitionFunction } from 'webpack'
import type { RawSourceMap } from 'source-map'
import type { Options as BaseOptions } from './index.js'

export interface Options extends BaseOptions {
  acorn?: AcornOptions,
}

// webpack sourcemap type is not exported, but is the second parameter of the loader
// definition.
// It is a union of `string | SourceMap | undefined`. Therefore we use `Extract<…, object>`
// to retrieve the `SourceMap` object type.
type WebpackSourceMap = Extract<Parameters<LoaderDefinitionFunction<Options>>[1], object>

async function doProcess(
  source: string,
  options: Options,
  file: string,
  originalMap: WebpackSourceMap,
  sourceMap: boolean
): Promise<{ code: string | null, map?: WebpackSourceMap }> {
  const ast = parse(source, {
    ecmaVersion: 2025,
    sourceType: 'module',
    ...(options.acorn || {})
  })
  const { code, map } = await process(source, ast, options, file, sourceMap)

  if (originalMap && map) {
    return { code, map: await mergeMaps(originalMap, map) }
  }

  return { code, map }
}

export default (function(source: string, map: WebpackSourceMap): void {
  const callback = this.async()

  doProcess(source, this.getOptions(), this.resourcePath, map, this.sourceMap ? true : false)
    .then(({ code, map }) => callback(null, code ?? source, map))
    .catch(callback)
} as LoaderDefinitionFunction<Options>)

const mergeMaps = async (
  oldMap: WebpackSourceMap,
  newMap: MagicStringSourceMap
): Promise<WebpackSourceMap> => {
  const { SourceMapConsumer, SourceMapGenerator } = await import('source-map');
  const toRawSourceMap = ({names, file, ...data}: WebpackSourceMap | MagicStringSourceMap): RawSourceMap => ({
    names: names ?? [],
    file: file ?? '',
    ...data,
  })
  const oldMapConsumer = await new SourceMapConsumer(toRawSourceMap(oldMap))
  const newMapConsumer = await new SourceMapConsumer(toRawSourceMap(newMap))
  const mergedMapGenerator = SourceMapGenerator.fromSourceMap(oldMapConsumer);

  newMapConsumer.eachMapping(m => {
    // Node does not have origin in original code.
    if (m.originalLine === null) {
      return
    }

    const origPosInOldMap = oldMapConsumer.originalPositionFor({
      line: m.originalLine,
      column: m.originalColumn
    })

    if (
      origPosInOldMap.line === null ||
      origPosInOldMap.column === null ||
      origPosInOldMap.source === null
    ) {
      return
    }

    mergedMapGenerator.addMapping({
      original: {
        line: origPosInOldMap.line,
        column: origPosInOldMap.column
      },
      generated: {
        line: m.generatedLine,
        column: m.generatedColumn
      },
      source: origPosInOldMap.source,
      name: origPosInOldMap.name ?? undefined
    })
  })

  oldMapConsumer.destroy();
  newMapConsumer.destroy();

  return JSON.parse(mergedMapGenerator.toString())
}
