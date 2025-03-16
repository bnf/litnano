import { process } from './process.js'
import type { Options } from './index.js'
import type { Plugin } from 'rollup'

export const litnano = (opt: Options = {}): Plugin => ({
  name: 'rollup-plugin-litnano',
  async transform(source, id) {
    try {
      const { code, map } = await process(source, this.parse(source), opt, id)
      return code !== null ? { code, map } : null
    } catch (e) {
      if (e instanceof Error) {
        this.error(e)
        return null
      }
      throw e
    }
  }
})
