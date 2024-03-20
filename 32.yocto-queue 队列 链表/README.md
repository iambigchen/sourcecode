# yocto-queue 队列 链表

[github地址](https://github.com/sindresorhus/yocto-queue)

## 环境准备

将代码 clone 到本地。

## 代码分析

yocto-queue 用 js 实现了 queue队列数据格式。在 O(1)时间复杂度，实现了enqueue、dequeue等 api。

O(1)的复杂度，肯定是基于链表实现，所以yocto-queue先实现了一个单向链表。value 保存值，next保存下一个节点。

```js
class Node {
	value;
	next;

	constructor(value) {
		this.value = value;
	}
}
```

Queue的实例对象有三个属性，
1. #head 链表的头节点，用于快速找到链表的头，dequeue删除队列的时候只需要将头节点进行移动即可。
2. #tail 链表的尾节点，用于快速找到链表的尾，enqueue插入队列的时候只需要将尾节点进行移动即可。
3. #size 存队列的长度。

为了让实例对象具有可迭代性，实现了`Symbol.iterator`方法。

```js
export default class Queue {
	#head;
	#tail;
	#size;

	constructor() {
		this.clear();
	}

	enqueue(value) {
		const node = new Node(value);

		if (this.#head) {
			this.#tail.next = node;
			this.#tail = node;
		} else {
			this.#head = node;
			this.#tail = node;
		}

		this.#size++;
	}

	dequeue() {
		const current = this.#head;
		if (!current) {
			return;
		}

		this.#head = this.#head.next;
		this.#size--;
		return current.value;
	}

    // clear 方法是将队列清空，直接将队列的头和尾置空即可。
	clear() {
		this.#head = undefined;
		this.#tail = undefined;
		this.#size = 0;
	}

	get size() {
		return this.#size;
	}

	* [Symbol.iterator]() {
		let current = this.#head;

		while (current) {
			yield current.value;
			current = current.next;
		}
	}
}

```
