// 导出页面为PDF格式
import html2Canvas from '@persagy2/html2canvas'
import JsPDF from 'jspdf'
import fileSaver from 'file-saver'
import watermark from './watermark'
export default class YkJsPdf {
  constructor(el, title, option) {
    this.container = (typeof el === 'string') ? document.querySelector(el) : el;
    this.option = {
      pageBreak: null,
      pageStartOffset: 0,
      ...option
    }
    this.title = title
    this.top = 0 // 修改成弹出窗截图，top永远是0
    /*window.pageYoffset = 0
    document.documentElement.scrollTop = 0
    document.body.scrollTop = 0*/
    this.watermarkInstance = null
  }
    /**
   *
   * @param {*} successCallback
   * @param {*} errorCallback
   * @param {*} options 配置是否需要下载等相关参数
   * @returns
   */
  outPdf(successCallback, errorCallback, options = { isSave: true, isPrint: false }) {
    if (!this.option.pageBreak || this.option.pageBreak && this.option.pageBreak.length === 0) {
      alert('请传入要参与分页计算的元素=>pageBreak')
      return
    }
    if (!this.container) {
      errorCallback && errorCallback({
        message: '请传入正确的id或元素'
      })
      return
    }
    try {
      this.split((node) => {
        if (this.option.watermarkOption) {
          this.watermarkInstance = new watermark({
            watermark_parent_node: node,
            ...this.option.watermarkOption
          })
          this.watermarkInstance.init()
        }
        return html2Canvas(node, {
          useCORS: true,
          allowTaint: true
        }).then((canvas) => {
          let contentWidth = canvas.width
          let contentHeight = canvas.height

          // 一页pdf显示html页面生成的canvas高度;
          let pageHeight = contentWidth / 592.28 * 841.89
          // console.log('一页pdf pageHeight', pageHeight)
          // 未生成pdf的html页面高度
          let leftHeight = contentHeight
          // 页面偏移
          let position = 0
          // a4纸的尺寸[595.28,841.89]，html页面生成的canvas在pdf中图片的宽高
          let imgWidth = 595.28
          let imgHeight = 592.28 / contentWidth * contentHeight

          let pageData = canvas.toDataURL('image/jpeg', 1.0)

          let pdf = new JsPDF('', 'pt', 'a4')

          // 有两个高度需要区分，一个是html页面的实际高度，和生成pdf的页面高度(841.89)
          // 当内容未超过pdf一页显示的范围，无需分页
          if (leftHeight < pageHeight) {
            pdf.addImage(pageData, 'JPEG', 0, 0, imgWidth, imgHeight)
          } else {
            while (leftHeight > 0) {
              pdf.addImage(pageData, 'JPEG', 0, position, imgWidth, imgHeight)
              leftHeight -= pageHeight
              position -= 841.89
              // 避免添加空白页
              if (leftHeight > 0) {
                pdf.addPage()
              }
            }
          }
          // 下载pdf
          if (options.isSave) {
            pdf.save(this.title + '.pdf');
          }
          // 自动打印
          if (options.isPrint) {
            pdf.autoPrint();
          }
          this.watermarkInstance.remove()
          document.body.removeChild(this.overlay)
          successCallback && successCallback()
          // 输出base64字符串
          return pdf.output('datauristring')
        }).catch((e) => errorCallback && errorCallback(e))
      })
    } catch (err) {
      errorCallback && errorCallback({
        message: '导出pdf失败'
      })
    }
  }
  outImage() {
    let source = this.cloneNode(this.container, false)
    this.mountNode(source)
    if (this.option.watermarkOption) {
      this.watermarkInstance = new watermark({
        watermark_parent_node: source,
        ...this.option.watermarkOption
      })
      this.watermarkInstance.init()
    }
    html2Canvas(source, {
      useCORS: true,
      allowTaint: true
    }).then((canvas) => {
      canvas.toBlob(blob => {
        fileSaver.saveAs(blob, this.title + '.png')
        document.body.removeChild(this.overlay)
      })
    })
  }
  mountNode(source) {
    let overlayCSS = {
      position: 'fixed',
      overflow: 'hidden',
      zIndex: 1000,
      left: 0,
      right: 0,
      bottom: 0,
      top: 0,
      backgroundColor: 'rgba(0,0,0,0.8)'
    };
    let containerCSS = {
      position: 'absolute',
      width: this.container.clientWidth + 'px',
      left: 0,
      right: 0,
      top: 0,
      height: 'auto',
      margin: 'auto',
      backgroundColor: 'white'
    };
    overlayCSS.opacity = 0
    this.overlay = this.createElement('div', { className: 'html2pdf__overlay', style: overlayCSS });
    this.containerBox = this.createElement('div', { className: 'html2pdf__container', style: containerCSS });
    this.containerBox.appendChild(source);
    this.overlay.appendChild(this.containerBox);
    document.body.appendChild(this.overlay)
  }
  split(callback) {
    let source = this.cloneNode(this.container, false)
    this.mountNode(source)

    let pageHeight = source.clientWidth / 592.28 * 841.89
    if (this.option.pageBreak && this.option.pageBreak.length > 0) {
      let allElement = []
      this.option.pageBreak.forEach(el => {
        allElement.push(...source.querySelectorAll(el))
      })
      allElement = allElement.sort(function (a, b) {
        let aClientRect = a.getBoundingClientRect()
        let bClientRect = b.getBoundingClientRect()
        return aClientRect.top - bClientRect.top
      })
      // console.log('allElement', allElement)
      // 进行分割操作，当dom内容已超出a4的高度，则将该dom前插入一个空dom，把他挤下去，分割
      for (let i = 0; i < allElement.length; i++) {
        let multiple = Math.ceil(this.getTopAndHeightTotal(allElement[i]) / pageHeight);
        if (this.isSplit(allElement, i, multiple * pageHeight, pageHeight)) {
          let el = allElement[i]
          let divParent = el.parentNode; // 获取该div的父节点
          let newNode = this.createElement('div', {
            className: 'emptyDiv',
            style: {
              height: multiple * pageHeight - this.getTopAndHeightTotal(el) + this.option.pageStartOffset + 'px',
              width: '100%',
              background: 'transparent'
            }
          })
          let next = allElement[i].nextSibling; // 获取div的下一个兄弟节点
          // 判断兄弟节点是否存在
          // console.log(next);
          if (next) {
            // 存在则将新节点插入到div的下一个兄弟节点之前，即div之后
            divParent.insertBefore(newNode, next);
          } else {
            // 不存在则直接添加到最后,appendChild默认添加到divParent的最后
            divParent.appendChild(newNode);
          }
        }
      }
    }
    callback(source)
  }
  isSplit (nodes, index, pageHeight, onePageHeight) {
    let clientRectNext = nodes[index + 1] ? nodes[index + 1].getBoundingClientRect() : 0
    let nextNPages = Math.abs(clientRectNext.bottom - clientRectNext.top) / onePageHeight
    // 计算当前这块dom是否跨越了a4大小，以此分割
    return this.getTopAndHeightTotal(nodes[index]) < pageHeight &&
      nodes[index + 1] && this.getTopAndHeightTotal(nodes[index + 1]) > pageHeight &&
      nextNPages <= 1;
  }
  getAbsoluteHeight(el) {
    // Get the DOM Node if you pass in a string
    el = (typeof el === 'string') ? document.querySelector(el) : el;
    const styles = window.getComputedStyle(el);
    // 需求只用判断一边的margin值
    const margin = parseFloat(styles['marginBottom'])/* +
    parseFloat(styles['marginTop']);*/
    return Math.ceil(margin);
  }
  getTopAndHeightTotal(el) {
    let clientRect = el.getBoundingClientRect()
    return clientRect.bottom + this.getAbsoluteHeight(el) - this.top
    // return getAbsoluteHeight(el) + el.offsetTop
  }
  // Deep-clone a node and preserve contents/properties.
  cloneNode(node, javascriptEnabled) {
    // Recursively clone the node.
    let clone = node.nodeType === 3 ? document.createTextNode(node.nodeValue) : node.cloneNode(false);
    for (let child = node.firstChild; child; child = child.nextSibling) {
      if (javascriptEnabled === true || child.nodeType !== 1 || child.nodeName !== 'SCRIPT') {
        clone.appendChild(this.cloneNode(child, javascriptEnabled));
      }
    }

    if (node.nodeType === 1) {
      // Preserve contents/properties of special nodes.
      if (node.nodeName === 'CANVAS') {
        clone.width = node.width;
        clone.height = node.height;
        clone.getContext('2d').drawImage(node, 0, 0);
      } else if (node.nodeName === 'TEXTAREA' || node.nodeName === 'SELECT') {
        clone.value = node.value;
      }

      // Preserve the node's scroll position when it loads.
      clone.addEventListener('load', function() {
        clone.scrollTop = node.scrollTop;
        clone.scrollLeft = node.scrollLeft;
      }, true);
    }

    // Return the cloned node.
    return clone;
  }

  // Create an HTML element with optional className, innerHTML, and style.
  createElement(tagName, opt) {
    let el = document.createElement(tagName);
    if (opt.className) el.className = opt.className;
    if (opt.innerHTML) {
      el.innerHTML = opt.innerHTML;
      let scripts = el.getElementsByTagName('script');
      for (let i = scripts.length; i-- > 0; null) {
        scripts[i].parentNode.removeChild(scripts[i]);
      }
    }
    for (let key in opt.style) {
      el.style[key] = opt.style[key];
    }
    return el;
  }
}
