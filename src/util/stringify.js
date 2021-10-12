

/**
 * Turns a value, into a string - do NOT use for JSON parsing, it both slower and changes the data (undefined !== 'undefined')
 * @param {any} val Define the exit criteria for what to wait for.
 * @example
 * // returns '123'
 * stringify(123);
 * @example
 * // returns 'undefined'
 * stringify(undefined);
 * @example
 * // returns '{a: undefined, b: null}'
 * stringify(undefined);
 * @returns {string}
 */
export default function stringify (val) {
  const type = typeof val
  if (type === 'undefined') {
    return 'undefined'
  } else if (Array.isArray(val)) {
    return JSON.stringify(val.map(stringify))
  } else if (type === 'object') {
    let ret = {}
    for (const key in val) {
      if (Object.hasOwnProperty(key)) {
        ret[key] = stringify(val[key])
      }
    }
    return JSON.stringify(ret)
  } else if(type === 'function') {
    return val.toString()
  } else {
    return JSON.stringify(val)
  }
}
