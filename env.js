/**
 * 设备平台
 */
const UA = window.navigator.userAgent.toLowerCase()
const devicePlat = {
  iOS: /ip(hone|ad|od)/i.test(UA),
  Android: /android/i.test(UA),
  WeChat: /micromessenger/i.test(UA),
}

/**
 * 运行环境
 */
const operationEnv = {
  localhost: /^localhost|^\d{1,}\.\d{1,}\.\d{1}/i.test(location.hostname),
  development: /^dev/i.test(location.hostname),
  betatest: /^test/i.test(location.hostname),
  production: !(/^dev|^test|^localhost|^\d{1,}\.\d{1,}\.\d{1}/i.test(location.hostname))
}

/**
 * 域名环境
 */
const origin = {
  // 公共接口域名
  public: {
    test: '',
    get use() {
      return operationEnv.production ? 'http://wx.papamama.me' : 'http://test.wx.papamama.me'
    }
  }
}

export default {
  ...devicePlat,
  ...operationEnv,
  origin
}
