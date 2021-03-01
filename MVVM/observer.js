//监听器
class Observer {
  constructor(data) {
    this.observer(data);
  }

  observer(data) {
    if (!!data && typeof data !== 'object') {
      return;
    }
    for (let [key, value] of Object.entries(data)) {
      //响应式
      this.defineReactive(data, key, value)
      //递归
      this.observer(value)
    }
  }

  //数据劫持
  defineReactive(data, key, value) {
    //每个对象需要添加订阅模式
    const that = this;
    const dep = new Dep();
    Object.defineProperty(data, key, {
      get() {
        Dep.target && dep.addSub(Dep.target) //订阅观察回调实例本身
        // console.log('触发get')
        // console.log('get==>',value)
        return value
      },
      set(newVal) {
        //如果是对象 则重新劫持
        if (newVal !== value) {
          that.observer(newVal)
          value = newVal;
          dep.notify(); //通知所有人数据更新
        }
        return newVal
      },
    })
  }
}

//订阅模式
class Dep {
  constructor() {
    this.subs = []; //收集依赖
  }

  addSub(watcher) {
    this.subs.push(watcher)
  }

  notify() {
    this.subs.forEach(watcher => watcher.update())
  }
}
