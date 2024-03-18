# Vue2 源码中那些实用的基础工具函数

## 环境准备
[vue2源码](https://github.com/vuejs/vue)

查看 vue2 的 README.md 或者 .github/Contributing.md 文件，里面开发准备步骤、项目解构等描述，以及环境要求等。

1. vue2开发步骤
需要 node 18+ pnpm 8+，clone 到本地后执行`pnpm i`安装依赖

2. 找到vue2的src/shared模块
server: contains code related to server-side rendering。

## 源码分析

shared目录中一共两个文件
- constants.ts // 全局共享的一些常量
- util.ts // 一些实用的基础工具函数
  
我们主要看 utils.ts里的一些方法实现

### 1.emptyObject
```ts
const emptyObject: Record<string, any> = Object.freeze({})
```
创建一个冻结了的空对象。判断一个对象是否被冻结，可以通过`Object.isFrozen`方法判断，`Object.isFrozen(emptyObject)`返回true`

### 2.isUndef
```ts
function isUndef(v: any): v is undefined | null {
  return v === undefined || v === null
}
```
判断 v 是 undefined 或者 null。需要注意函数返回值使用了 ts 的谓词类型。

### 3.isDef 
```ts
function isDef<T>(v: T): v is NonNullable<T> {
  return v !== undefined && v !== null
}
```
判断 v 既不是 undefined 也不是 null。NonNullable<T>是去除 T 中 null 和 undefined 的类型。
```ts
type NonNullable<T> = T extends null | undefined ? never : T
type NonNullable<T> = T & {}
```

### 4.isPrimitive
```ts
function isPrimitive(value: any): boolean {
  return (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'symbol' ||
    typeof value === 'boolean'
  )
}
```
判断 value 是否为原始值。 js 原始数据类型有 7 个，String 、 Number 、 Symbol 、 boolean 、 null 、 undefined 、 bigInt
null 和 undefined 之前的 isUndef 方法已经定义了。这里差个判断 bigInt，`typeof value === 'BigInt'`

### 5.isObject
```ts
function isObject(obj: any): boolean {
  return obj !== null && typeof obj === 'object'
}
```
因为 type null === 'object'，所以需要先把 null 排除。但数组、Set、 Map判断也会是 true

### 6.toRawType
```ts
const _toString = Object.prototype.toString
function toRawType(value: any): string {
  return _toString.call(value).slice(8, -1)
}
```
通过Object.prototype.toString方法返回一个表示该对象的字符串

### 7.isValidArrayIndex
```ts
function isValidArrayIndex(val: any): boolean {
  const n = parseFloat(String(val))
  return n >= 0 && Math.floor(n) === n && isFinite(val)
}
```
1.1 不是有效 key。 1.0是有效 key
通过parseFloat把 1.0 转成 1，再和 Math.floor对比是否相等。isFinite函数判断 val 是否为一个有限数值

### 8.isPromise
```ts
function isPromise(val: any): val is Promise<any> {
  return (
    isDef(val) &&
    typeof val.then === 'function' &&
    typeof val.catch === 'function'
  )
}
```
判断非 null 和 undefined, 在判断 val.then 和 val.catch 是否为函数

### 9.toString
```ts
function toString(val: any): string {
  return val == null
    ? ''
    : Array.isArray(val) || (isPlainObject(val) && val.toString === _toString)
    ? JSON.stringify(val, replacer, 2)
    : String(val)
}
```
对数组、对象并且对象的 toString 方法是 Object.prototype.toString 的时候，使用 JSON.stringify 方法，否则使用 String 方法。

JSON.stringify接受三个参数，JSON.stringify(value[, replacer [, space]])

replacer 参数可以是一个函数或者一个数组。作为函数，它有两个参数，键（key）和值（value），它们都会被序列化。如果 replacer 是一个数组，数组的值代表将被序列化成 JSON 字符串的属性名。


### 10.toNumber
```ts
function toNumber(val: string): number | string {
  const n = parseFloat(val)
  return isNaN(n) ? val : n
}
```
转换数字，如果转换失败，返回 val

### 11.makeMap
```ts
function makeMap(
  str: string,
  expectsLowerCase?: boolean
): (key: string) => true | undefined {
  const map = Object.create(null)
  const list: Array<string> = str.split(',')
  for (let i = 0; i < list.length; i++) {
    map[list[i]] = true
  }
  return expectsLowerCase ? val => map[val.toLowerCase()] : val => map[val]
}
```
传入一个逗号分隔的字符串，返回一个函数，监测 key 是否在这个 map 中

### 12.remove
```ts
function remove(arr: Array<any>, item: any): Array<any> | void {
  const len = arr.length
  if (len) {
    // fast path for the only / last item
    if (item === arr[len - 1]) {
      arr.length = len - 1
      return
    }
    const index = arr.indexOf(item)
    if (index > -1) {
      return arr.splice(index, 1)
    }
  }
}
```
移除数据中的一项，如果移除的是数组最后一项，直接降数组长度截断。splice是一个相对消耗性能的函数。

### 13.hasOwn
```ts
const hasOwnProperty = Object.prototype.hasOwnProperty
function hasOwn(obj: Object | Array<any>, key: string): boolean {
  return hasOwnProperty.call(obj, key)
}
```
监测 key 是否是自己的属性，而不是通过原型链找到的属性。

### 14.cached
```ts
function cached<R>(fn: (str: string) => R): (sr: string) => R {
  const cache: Record<string, R> = Object.create(null)
  return function cachedFn(str: string) {
    const hit = cache[str]
    return hit || (cache[str] = fn(str))
  }
}
```

### 15.camelize
```ts
const camelizeRE = /-(\w)/g
const camelize = cached((str: string): string => {
  return str.replace(camelizeRE, (_, c) => (c ? c.toUpperCase() : ''))
})
```
将字符-转成驼峰写法 on-click => onClick

### 16.capitalize
```ts
const capitalize = cached((str: string): string => {
  return str.charAt(0).toUpperCase() + str.slice(1)
})
```
首字母大写

### 17.hyphenate
```ts
const hyphenateRE = /\B([A-Z])/g
const hyphenate = cached((str: string): string => {
  return str.replace(hyphenateRE, '-$1').toLowerCase()
})
```
将驼峰写法转成-写法 onClick => on-click。\B为非单词边界，防止ABC变成 -a-b-c

### 18.polyfillBind
```ts
function polyfillBind(fn: Function, ctx: Object): Function {
  function boundFn(a: any) {
    const l = arguments.length
    return l
      ? l > 1
        ? fn.apply(ctx, arguments)
        : fn.call(ctx, a)
      : fn.call(ctx)
  }

  boundFn._length = fn.length
  return boundFn
}

function nativeBind(fn: Function, ctx: Object): Function {
  return fn.bind(ctx)
}

const bind = Function.prototype.bind ? nativeBind : polyfillBind
```
对一些老浏览器，不支持 bind 函数，实现一个 polyfillBind，通过 apply 和 call 实现

### 19.toArray
```ts
function toArray(list: any, start?: number): Array<any> {
  start = start || 0
  let i = list.length - start
  const ret: Array<any> = new Array(i)
  while (i--) {
    ret[i] = list[i + start]
  }
  return ret
}
```
类数组转数组，从 start 开始

### 20.extend
```ts
function extend(
  to: Record<PropertyKey, any>,
  _from?: Record<PropertyKey, any>
): Record<PropertyKey, any> {
  for (const key in _from) {
    to[key] = _from[key]
  }
  return to
}
```
合并两个对象，遍历赋值

### 21.toObject
```ts
function toObject(arr: Array<any>): object {
  const res = {}
  for (let i = 0; i < arr.length; i++) {
    if (arr[i]) {
      extend(res, arr[i])
    }
  }
  return res
}
```
数组转对象 toObject(['a', 'b']) => {'0': 'a', '1': 'b'}

### 22.noop
```ts
function noop(a?: any, b?: any, c?: any) {}
```
空函数

### 23.looseEqual
```ts
function looseEqual(a: any, b: any): boolean {
  if (a === b) return true
  const isObjectA = isObject(a)
  const isObjectB = isObject(b)
  if (isObjectA && isObjectB) {
    try {
      const isArrayA = Array.isArray(a)
      const isArrayB = Array.isArray(b)
      if (isArrayA && isArrayB) {
        return (
          a.length === b.length &&
          a.every((e: any, i: any) => {
            return looseEqual(e, b[i])
          })
        )
      } else if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime()
      } else if (!isArrayA && !isArrayB) {
        const keysA = Object.keys(a)
        const keysB = Object.keys(b)
        return (
          keysA.length === keysB.length &&
          keysA.every(key => {
            return looseEqual(a[key], b[key])
          })
        )
      } else {
        /* istanbul ignore next */
        return false
      }
    } catch (e: any) {
      /* istanbul ignore next */
      return false
    }
  } else if (!isObjectA && !isObjectB) {
    return String(a) === String(b)
  } else {
    return false
  }
}
```
宽松相等 如果是数组、对象进行递归对比，如果是日期，判断 getTime是否相等。如果不是对象，通过 String 转字符串后对比。

### 24.looseIndexOf
```ts
function looseIndexOf(arr: Array<unknown>, val: unknown): number {
  for (let i = 0; i < arr.length; i++) {
    if (looseEqual(arr[i], val)) return i
  }
  return -1
}
```
宽松的 indexOf

### 25.once
```ts
function once<T extends (...args: any[]) => any>(fn: T): T {
  let called = false
  return function () {
    if (!called) {
      called = true
      fn.apply(this, arguments as any)
    }
  } as any
}
```
函数执行一次

### 26.hasChanged
```ts
function hasChanged(x: unknown, y: unknown): boolean {
  if (x === y) {
    return x === 0 && 1 / x !== 1 / (y as number)
  } else {
    return x === x || y === y
  }
}
```
Object.is的 polyfill。 === 有以下两个弊端 NaN !== NaN 和 0 === -0。所以需要用 x === 0 && 1 / x !== 1 / y 来规避 0 和 -0
用x === x || y === y来规避 NaN
