class Compile {
  constructor(el, vm) {
    this.$el = this.isElementNode(el, 1) ? el : document.querySelector(el); //开发者可能会输入dom或者字符串
    this.vm = vm;
    let fragment = this.node2Fragment(this.$el);
    this.compile(fragment);
    this.$el.appendChild(fragment)
  }

  //helpers
  //判断是否节点
  isElementNode(node, type) {
    return type ? node.nodeType === type : node.nodeType;
  }

  //core
  //塞入文档碎片
  node2Fragment(el) {
    //创建文档碎片
    let fragment = document.createDocumentFragment();
    while (el.firstChild) {
      fragment.appendChild(el.firstChild);
    }
    return fragment
  }

  //模板编译
  compile(node) {
    let childNodes = node.childNodes;
    if (childNodes.length === 0) return;
    childNodes.forEach(node => {
      if (this.isElementNode(node, 1)) { //处理节点
        // console.log('处理节点 =>', node)
        this.compile(node);
        this.compileElement(node)
      }
      if (this.isElementNode(node, 3)) { //处理文本
        // console.log('处理文本 =>', node)
        this.compileText(node)
      }
    })
  }

  //替换元素与模板方法
  compileText(node) { //{{}}处理
    let text = node.textContent;
    let reg = /\{\{([^}]+)\}\}/g;
    if (reg.test(text)) {
      this.compileHandler(node, text, 'text');
    }
  }

  compileElement(node) {
    Array.from(node.attributes).forEach(attr => {
      const name = attr.name;
      const value = attr.value
      if (name.includes('v-')) {
        this.compileHandler(node, value, 'model')
      }
    })
  }

  //获取当前的值
  getVal(vm, text) {
    return text.split('.').reduce((prev, next) => prev[next], vm.$data)
  }

  setVal(vm, text, value) {
    return text.split('.').reduce((prev, next, currentIndex, arr) => {
      if (currentIndex === arr.length - 1) {
        return prev[next] = value
      }
      return prev[next]
    }, vm.$data)
  }

  //更新替换
  compileHandler(node, value, key) {
    const that = this;
    const directive = {
      text(node, value) {
        let text = node.textContent;
        text = text.replace(/\{\{([^}]+)\}\}/g, (...arg) => {
          //获取每一个{{}}里面的值
          let val = arg[1];
          // 当值变化后，文本节点要重新获取依赖属性更新文本
          new Watcher(that.vm, val, newValue => {
            updater[key](node, newValue)
          })
          //对每一个值进行替换
          return that.getVal(that.vm, arg[1])
        })
        updater[key](node, text)
      },
      model(node, value) {
        // 当值变化后，文本节点要重新获取依赖属性更新文本
        new Watcher(that.vm, value, newValue => {
          updater[key](node, that.getVal(that.vm, value))
        })
        node.addEventListener('input', e => {
          const newValue = e.target.value;
          that.setVal(that.vm, value, newValue);
        });
        updater[key](node, that.getVal(that.vm, value))
      }
    }
    const updater = {
      text(node, value) {
        node.textContent = value;
      },
      model(node, value) {
        node.value = value
      }
    }

    //对指令进行编译
    directive[key](node, value);

  }


}
