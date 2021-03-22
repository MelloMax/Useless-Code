/**
 * 为什么会有Promise? ==> 为了解决回调地狱 ===> 回调地狱: 多层嵌套的问题.每种任务的处理结果存在两种可能性（成功或失败,那么需要在每种任务执行结束后分别处理这两种可能性。
 *
 * Coding
 * 先写基本的promise
 *    1.声明状态变量 等待 成功 失败
 *    2.声明获取的值与失败的值
 *    3.判断状态变量处理对应的操作
 * promise必须支持异步如何支持异步呢? => 发布订阅者模式
 * 支持promise可以then多次如何链式调用? then().then()....
 *    1.在then执行创建本身的promise获取resolve函数 等待 上一个then的 onResolved 并把 resolve 传参进去
 *
 * */


const PENDING = "PENDING";
const RESOLVED = "RESOLVED";
const REJECTED = "REJECTED";

class _Promise {
  constructor(executor) {
    this.value = undefined;
    this.reason = undefined;
    this.status = PENDING;
    //异步处理
    this.onResolvedCallback = [];
    this.onRejectedCallback = [];

    const resolve = value => {
      if (this.status === PENDING) {
        //改变当前状态
        this.status = RESOLVED;
        this.value = value;
        this.onResolvedCallback.forEach(fn => fn())
      }
    }
    const reject = error => {
      if (this.status === PENDING) {
        //改变当前状态
        this.status = REJECTED
        this.reason = error;
        this.onRejectedCallback.forEach(fn => fn())
      }
    }

    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error);
    }

  }

  then(onResolved, onRejected) {
    //then(res=>{...do something})
    //为了实现链式调用，创建一个新的promise
    // 如果返回value值是一个promise那么在new的时候executor就立即执行了，就会执行他的resolve，那么数据就会传递到他的then中
    return new _Promise((resolve, reject) => {
      //成功回调
      if (this.status === RESOLVED) {
        try {
          const value = onResolved(this.value); //当前resolve执行所返回的值
          if (value instanceof _Promise) { //判断原型是否该构造函数,是
            value.then(resolve, reject) //?? 相当于 new Promise(reslove=>reslove('helloworld')).then(res => new Promise(resolve=>reslove(res)))
          } else {
            resolve(value)
          }
        } catch (error) {
          reject(error);
        }
      }
      //失败回调
      if (this.status === REJECTED) {
        try {
          let value = onRejected(this.reason)
          if (value instanceof _Promise) { //判断原型是否该构造函数
            value.then(resolve, reject)
          } else {
            resolve(value)
          }
        } catch (error) {
          reject(error);
        }
      }
      //异步处理
      if (this.status === PENDING) {
        //如果异步操作,先塞入队列
        this.onResolvedCallback.push(() => {
          //...可以加自己逻辑上去
          try {
            let value = onResolved(this.value);
            if (value instanceof _Promise) { //判断原型是否该构造函数
              value.then(resolve, reject)
            } else {
              resolve(value)
            }
          } catch (error) {
            reject(error);
          }

        })
        this.onRejectedCallback.push(() => {
            try {
              let value = onRejected(this.reason);
              if (value instanceof _Promise) { //判断原型是否该构造函数
                value.then(resolve, reject)
              } else {
                resolve(value)
              }
            } catch (error) {
              reject(error);
            }
        })
      }
    })
  }
}

//测试
new _Promise(success => success('helloWorld'))
  .then(value => new _Promise((resolve, reject) => setTimeout(() => reject(value), 3000)))
  .then(value => {
    console.log('value =>', value)
  }, error => {
    console.log('error =>', error)
  })
