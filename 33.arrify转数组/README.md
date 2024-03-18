# arrify 转数组

[github地址](https://github.com/sindresorhus/arrify)

## 环境准备
`clone` 代码到本地

## 代码分析

arrify的源码很短，一共 19 行。

```js
export default function arrify(value) {
    // 如果传的值是 null 或者 undefined，直接返回空数组
	if (value === null || value === undefined) {
		return [];
	}
    // 如果是数组 也直接返回
	if (Array.isArray(value)) {
		return value;
	}
    // 如果是字符串，直接返回 [数组]
	if (typeof value === 'string') {
		return [value];
	}
    // 如果是可迭代对象，直接返回数组解构的值
	if (typeof value[Symbol.iterator] === 'function') {
		return [...value];
	}
    // 兜底，其他情况全部返回 [value]
	return [value];
}
```

## 重点

- 可迭代对象的判断： 该对象是否拥有 Symbol.iterator 属性，且该属性的值为函数。
- package.json 的 "type" = "module", arrify包是个 ESM 格式的模块。所以引入的时候，必须使用import 语法，不能使用require。