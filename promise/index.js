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
      //改变当前状态
      this.status = RESOLVED;
      this.value = value;
    }
    const reject = error => {
      this.status = REJECTED
      this.reason = error;
    }

    try {
      executor(resolve, reject)
    } catch (error) {
      reject(error);
    }

  }

  then(onResolved, onRejected) {
    //then(res=>{...do something})
    //先判断当前状态 做出相对操作

    //成功回调
    if (this.status === RESOLVED) {
      return onResolved(this.value)
    }
    //失败回调
    if (this.status === REJECTED) {
      return onRejected(this.reason)
    }
    //异步处理
    if (this.status === PENDING) {
      //如果异步操作,先塞入队列
      this.onResolvedCallback.push(()=>{
        //...可以加自己逻辑上去
        onResolved(this.value)
      })
      this.onRejectedCallback.push(()=>{
        onRejected(this.reason)
      })
    }

  }
}

console.log(new _Promise(success => success('helloWorld')).then(value => value))
