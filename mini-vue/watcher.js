/**订阅者作为Observer和Compile之间通信的桥梁
 * 1、在自身实例化时往属性订阅器(dep)里面添加自己
 * 2、自身必须有一个update()方法
 * 3、待属性变动dep.notice()通知时，能调用自身的update()方法，并触发Compile中绑定的回调，则功成身退。
 * */

class Watcher {
  constructor(vm, expr, cb) {
    this.vm = vm;
    this.expr = expr;
    this.cb = cb;
    //初始化 每个值先获取旧值
    this.oldValue = this.get() //保存旧值
  }

  get() {
    Dep.target = this;
    const value = this.getVal(this.vm, this.expr)
    Dep.target = null;
    return value
  }

  getVal(vm, text) {
    return text.split('.').reduce((prev, next) => prev[next], vm.$data)
  }

  update() {
    const newValue = this.getVal(this.vm, this.expr);
    if (newValue !== this.oldValue) {
      //当新值和旧值不相等时候触发回调
      this.oldValue = newValue; //每次更新把旧值替换新值
      this.cb(newValue)
    }
  }
}
