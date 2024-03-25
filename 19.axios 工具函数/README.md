# axios 里的工具函数

[github地址](https://github.com/axios/axios)

## 环境准备

clone 代码到本地，，看一下`CONTRIBUTING.md`里的开发介绍。

##  源码解读

我们找到 `lib/utils.js` 文件，这里是 axios 的工具函数。

### kindOf、kindOfTest、typeOfTest

```js
const {toString} = Object.prototype;
const {getPrototypeOf} = Object;

const kindOf = (cache => thing => {
    const str = toString.call(thing);
    return cache[str] || (cache[str] = str.slice(8, -1).toLowerCase());
})(Object.create(null));

const kindOfTest = (type) => {
  type = type.toLowerCase();
  return (thing) => kindOf(thing) === type
}

const typeOfTest = type => thing => typeof thing === type;
```

类型判断函数，kindOf、kindOfTest通过`Object.prototype.toString`获取对象的类型和进行类型判断。typeOfTest是通过 typeOf 进行类型判断。

`kindOf`通过 iife 实现了缓存。

### isBuffer
```js
function isBuffer(val) {
  return val !== null && !isUndefined(val) && val.constructor !== null && !isUndefined(val.constructor)
    && isFunction(val.constructor.isBuffer) && val.constructor.isBuffer(val);
}
```
axios是可以node 端使用的，所以也需要判断是否是buffer。是否为buffer可以通过`Buffer.isBuffer`判断。这里先判断是否有构造函数 constructor，再用构造函数的 isBuffer 方法判断是否为 Buffer。

axios 是怎么区分是浏览器端还是 node 端？ 可以看一下`package.json`文件的`exports`的值，这里指定了`browser`的入口文件是`./dist/browser/axios.cjs`, 默认是 `./dist/node/axios.cjs`。打包的时候，通过 rollup 配置，会打出不同格式的包。

### forEach
```js
function forEach(obj, fn, {allOwnKeys = false} = {}) {
  // Don't bother if no value provided
  if (obj === null || typeof obj === 'undefined') {
    return;
  }

  let i;
  let l;

  // Force an array if not already something iterable
  if (typeof obj !== 'object') {
    /*eslint no-param-reassign:0*/
    obj = [obj];
  }

  if (isArray(obj)) {
    // Iterate over array values
    for (i = 0, l = obj.length; i < l; i++) {
      fn.call(null, obj[i], i, obj);
    }
  } else {
    // Iterate over object keys
    const keys = allOwnKeys ? Object.getOwnPropertyNames(obj) : Object.keys(obj);
    const len = keys.length;
    let key;

    for (i = 0; i < len; i++) {
      key = keys[i];
      fn.call(null, obj[key], key, obj);
    }
  }
}
```
对 obj 遍历执行函数 fn，如果是数组，直接遍历，如果是对象，遍历对象的 key。

### findKey
```js
function findKey(obj, key) {
  key = key.toLowerCase();
  const keys = Object.keys(obj);
  let i = keys.length;
  let _key;
  while (i-- > 0) {
    _key = keys[i];
    if (key === _key.toLowerCase()) {
      return _key;
    }
  }
  return null;
}
```
不区分大小写的找到对象中的 key

### _global
```js
const _global = (() => {
  /*eslint no-undef:0*/
  if (typeof globalThis !== "undefined") return globalThis;
  return typeof self !== "undefined" ? self : (typeof window !== 'undefined' ? window : global)
})();
```
全局对象，如果有 globalThis 返回 globalThis，其次是 self window 和 global 。因为 axios 是浏览器和 node 通用，但 node 和浏览器端全局对象有所区别，所以需要做一下兼容判断。globalThis是为了解决这种问题，提出的，但可能低版本会不存在这个对象。在 webWorker 中是拿不到 global 和 window 的，只能通过 self获取全局对象。在 node 中 window 不存在，而浏览器中则是 global 不存在。