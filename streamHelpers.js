export function map(fn) {
  return async function* (iterable) {
    for await (const item of iterable) {
      yield fn(item);
    }
  }
}

export function filter(predicate) {
  return async function*(iterable) { 
    for await (const item of iterable) { 
      predicate(item) && (yield item) 
    } 
  }
}