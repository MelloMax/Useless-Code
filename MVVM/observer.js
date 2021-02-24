//监听器
class Observer {
  constructor(data) {
    this.observer(data);
  }

  observer(data) {
    if (!!data && typeof data !== 'object' && typeof data !== 'function') {
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
    Object.defineProperty(data, key, {
      get() {
        console.log('触发get')
        return value
      },
      set(newVal) {
        console.log('触发set==>',newVal);
        return newVal
      },
    })
  }
}

//订阅模式
class Dep{
  constructor() {
  }
}
