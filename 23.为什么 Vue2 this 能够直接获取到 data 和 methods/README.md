# 为什么 Vue2 this 能够直接获取到 data 和 methods ?

## 问题描述

为什么我们在 vue2 中可以直接通过 `this.`获取到我们定义的data 和 methods ?

```js
const vm = new Vue({
    data: {
        name: 'hello',
    },
    methods: {
        sayName(){
            console.log(this.name);
        }
    },
})
```

## 环境准备
[vue2源码](https://github.com/vuejs/vue)

1. 将 vue2 源码 clone到本地，并且安装好依赖。
2. 查看vue2 的 `github/CONTRIBUTING.md`文件，了解基本都的 npm 指令。这里告诉了我们，我们可以通过 npm run  dev来打出一个用于本地开发的包。打完之后代码在`dist/vue.js`中。
3. 我们在 examples 文件夹中新增一个 `mytest.html`用于测试。
```html
// example/mytest.html
<script src="../dist/vue.js"></script>
<div id="app">{{name}}</div>
<script>
    const vm = new Vue({
        el: '#app',
        data: {
            name: 'hello',
        },
        methods: {
            sayName(){
                console.log(this.name);
            }
        },
    });
    // 用于调试
    debugger
    console.log(vm.name);
    console.log(vm.sayName());
</script>
```
4. 在 vue 目录下，执行`http-server -p8000`。启动一个服务器，访问`http://localhost:8000/example/mytest.html`。（没有安装 http-server的，可以先全局安装一下。npm install -g http-server）

5. 打开控制台，刷新页面。发现会自动在 debugger 处打好断点了。我们可以通过控制台的调试面板进行调试。

## 源码分析

```js
function Vue(options) {
    if (!(this instanceof Vue)) {
        warn$2('Vue is a constructor and should be called with the `new` keyword');
    }
    this._init(options);
}
```

当我们执行 new Vue() 的时候，会执行到上面的代码。先对是不是通过 new 来实例化进行判断。之后执行_init函数

### _init

```js
Vue.prototype._init = function (options) {
    ...
    initState(vm);
    ...
}
```

_init的实现是用过原型链，向 Vue 的prototype上挂载了_init函数。这样就可以直接通过 this._init(options) 来调用了。_init函数主要做了很多初始化的操作，我们主要关注的是initState函数。

### initState

```js
function initState(vm) {
    var opts = vm.$options;
    if (opts.props)
        initProps$1(vm, opts.props);
    // Composition API
    initSetup(vm);
    if (opts.methods)
        initMethods(vm, opts.methods);
    if (opts.data) {
        initData(vm);
    }
    else {
        var ob = observe((vm._data = {}));
        ob && ob.vmCount++;
    }
    if (opts.computed)
        initComputed$1(vm, opts.computed);
    if (opts.watch && opts.watch !== nativeWatch) {
        initWatch(vm, opts.watch);
    }
}
```
这里通过方法名，可以看出每个函数的作用。先判断有没有定义 props，如果有则执行initProps函数。`initSetup`函数是Composition写法的初始化，可以跳过。如果定义了methods，则执行initMethods。如果有data则执行initData。如果有computed执行initComputed。如果有watch则执行initWatch。

### initMethods

```js
function initMethods(vm, methods) {
    var props = vm.$options.props;
    for (var key in methods) {
        {
            if (typeof methods[key] !== 'function') {
                warn$2("Method \"".concat(key, "\" has type \"").concat(typeof methods[key], "\" in the component definition. ") +
                    "Did you reference the function correctly?", vm);
            }
            if (props && hasOwn(props, key)) {
                warn$2("Method \"".concat(key, "\" has already been defined as a prop."), vm);
            }
            if (key in vm && isReserved(key)) {
                warn$2("Method \"".concat(key, "\" conflicts with an existing Vue instance method. ") +
                    "Avoid defining component methods that start with _ or $.");
            }
        }
        vm[key] = typeof methods[key] !== 'function' ? noop : bind$1(methods[key], vm);
    }
}
```
initMethods主要是将methods中的方法挂载到vm上。对定义的 methods 遍历，判断 1. methods[key] 是不是函数，2. 当前的 key 是否已经在 props 中定义过。（为什么只判断 props 中是否有定义？ 因为 props 的初始化是在 methods 之前。而 data、 computed 的初始化是在 methods 之后。）3. key 是否在 vm 上已经定义过。之后将方法绑定到 vm 上， 如果methods[key] 不是函数则绑定一个空函数。如果是函数，则通过 bind 来把 vm 绑定this。

noop 和 bind 函数的实现都在 shared中实现了。[vue2 工具函数](../24.vue2工具函数/README.md)

### initData

```js
function initData(vm) {
    var data = vm.$options.data;
    data = vm._data = isFunction(data) ? getData(data, vm) : data || {};
    if (!isPlainObject(data)) {
        data = {};
        warn$2('data functions should return an object:\n' +
                'https://v2.vuejs.org/v2/guide/components.html#data-Must-Be-a-Function', vm);
    }
    // proxy data on instance
    var keys = Object.keys(data);
    var props = vm.$options.props;
    var methods = vm.$options.methods;
    var i = keys.length;
    while (i--) {
        var key = keys[i];
        {
            if (methods && hasOwn(methods, key)) {
                warn$2("Method \"".concat(key, "\" has already been defined as a data property."), vm);
            }
        }
        if (props && hasOwn(props, key)) {
            warn$2("The data property \"".concat(key, "\" is already declared as a prop. ") +
                    "Use prop default value instead.", vm);
        }
        else if (!isReserved(key)) {
            proxy(vm, "_data", key);
        }
    }
    // observe data
    var ob = observe(data);
    ob && ob.vmCount++;
}
```

1. 因为 data 可以是一个函数或者是个对象。如果是函数 则执行getData函数 将函数返回值挂载到 vm._data 上。，否则直接把data挂载到 vm._data 上。
2. 再次对 data 进行遍历，判断是否已经在 props 和 methods 中定义过了。如果没有在props 和 methods 中定义过，并且 key 也不是保留字段，则执行`proxy(vm, "_data", key);`

### proxy

```js
var sharedPropertyDefinition = {
    enumerable: true,
    configurable: true,
    get: noop,
    set: noop
};
function proxy(target, sourceKey, key) {
    sharedPropertyDefinition.get = function proxyGetter() {
        return this[sourceKey][key];
    };
    sharedPropertyDefinition.set = function proxySetter(val) {
        this[sourceKey][key] = val;
    };
    Object.defineProperty(target, key, sharedPropertyDefinition);
}
```

proxy函数就是通过`Object.defineProperty`对vm[key]进行代理。如果我们访问vm[key]，比如 this.name时，则走到了 get 方法中。 get 方式让我们真正获取的是 `this['_data']['name']`,因为之前我们已经把 data 挂载到了 vm._data上了，所以我们可以直接获取到 data 里的 name 值。 set 也是同理，让我们给 this.name 赋值的时候，走的是 set 方法，实际是给`this['_data']['name']`赋值。

## 总结

我们通过调试，对 vue2 的源码进行了简单的分析。因为只是分析为什么可以通过 this直接获取 data 和 methods，所以对_init、initData等方法的很多部分都没有继续调试分析。