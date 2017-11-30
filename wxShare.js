;(function() {
  // 去除微信默认参数
  if (/from=\w{1,}/.test(location.search) || /isappinstalled=\w{1,}/.test(location.search)) {
    var newSearch = location.search.replace(/from=\w{1,}(&|$)/, '').replace(/isappinstalled=\w{1,}(&|$)/, '').replace(/&$|\?$/, '');
    var newUrl = location.origin + location.pathname + newSearch;
    location.replace(newUrl);
  }

  var wxClient = /MicroMessenger/i.test(navigator.userAgent);

  var operationEnv = {
    localhost: /^localhost|^\d{1,}\.\d{1,}\.\d{1,}/i.test(location.hostname),
    devlopment: /^dev/i.test(location.hostname),
    betatest: /^test/i.test(location.hostname),
    production: !(/^dev|^test|^localhost|^\d{1,}\.\d{1,}\.\d{1}/i.test(location.hostname))
  }

  var originEnv = {
    test: 'http://test.wx.papamama.me',
    prod: 'http://wx.papamama.me',
    get use() {
      return operationEnv.production ? 'http://wx.papamama.me' : 'http://test.wx.papamama.me'
    }
  }

  var API = {
    signature: '/api/signature'
  }

  for (var key in API) {
    API[key] = originEnv.use + API[key] + '?date=' + Date.now();
  }

  /////////////////////////////////////////////////////////////////////////
  function request(option) {
    if (String(option) !== '[object Object]') return undefined
    option.method = option.method ? option.method.toUpperCase() : 'GET'
    option.data = option.data || {}
    var formData = []
    for (var key in option.data) {
      formData.push(''.concat(key, '=', option.data[key]))
    }
    option.data = formData.join('&')

    if (option.method === 'GET') {
      option.url += location.search.length === 0 ? ''.concat('?', option.data) : ''.concat('&', option.data)
    }

    var xhr = new XMLHttpRequest()
    xhr.responseType = option.responseType || 'json'
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          if (option.success && typeof option.success === 'function') {
            option.success(xhr.response)
          }
        } else {
          if (option.error && typeof option.error === 'function') {
            option.error()
          }
        }
      }
    }
    xhr.open(option.method, option.url, true)
    if (option.method === 'POST') {
      xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded')
    }
    xhr.send(option.method === 'POST' ? option.data : null)
  }

  ///////////////////////////////////////////////////////////////////////
  function WxShare() {
    this.config = {
      debug: false,
      signature: '',
      jsApiList: [
        'onMenuShareTimeline',
        'onMenuShareAppMessage'
      ]
    }

    this.requestLimit = 3
    this.requestCnt = 0

    this.getSinature = function () {
      var that = this;

      if (!wxClient || operationEnv.localhost) {
        window.weui.topTips('请在微信中打开');
        return undefined
      }

      if (!window.wx) {
        setTimeout(function() {
          that.getSinature()
        }, 100)
      }

      if (this.config.signature) {
        // 已获取签名
        this.verify();
        return true
      }

      if (this.requestCnt > this.requestLimit) {
        return undefined
      }
      this.requestCnt += 1
      request({
        url: API.signature,
        method: 'POST',
        data: {
          url: location.origin + location.pathname + location.search
        },
        success: function (res) {
          // {
          //   "code": 0,
          //   "data": {
          //     "signature": "9ef0893551b85a5a098d3bd7fadc0330fba2e287",
          //     "nonceStr": "eccb84c06bbedd7954dba5ecec61150d",
          //     "timestamp": 1479186993,
          //     "appId": "wx34e15ff604fb7617"
          //   }
          // }
          if (res.code !== 0) {
            window.weui.topTips(res.error || '网络繁忙');
            return undefined
          }

          that.config.signature = res.data.signature;
          that.config.nonceStr = res.data.nonceStr;
          that.config.timestamp = res.data.timestamp;
          that.config.appId = res.data.appId;

          that.verify();
        },
        error: function (err) {

        }
      })
    }

    this.verify = function () {
      var that = this;

      // 权限验证配置
      wx.config(that.config);

      // 成功验证
      wx.ready(function () {
        that.share()
      });

      // 失败验证
      wx.error(function (res) {
        that.config.signature = ''; // 清除 signature
        that.getSinature();
      });
    }

    this.share = function () {
      // 在 body 下：
      // <div style="display: none;">
      //   <img id="wx-share-icon" src="./imgs/wxshare.jpg?v=1.0" alt="">
      // </div>
      var img = document.getElementById('wx-share-icon').src;
      var shareUrl = location.origin + location.pathname + location.search;
      var config = {
        title: '年末投资迷茫？泰九点明方向！',
        link: shareUrl,
        imgUrl: img,
        desc: '年末如何打赢投资收官战，绑定资金账号免费获取VIP视频，还有话费奖励等你来抽！'
      };

      // 检查signature存在
      if (!this.config.signature) {
        this.getSinature();
        return undefined
      }

      // 分享到朋友圈
      wx.onMenuShareTimeline({
        title: config.title,
        link: config.link,
        imgUrl: config.imgUrl,
        success: function () {
          // TODO: 用户确认分享后执行的回调函数
        },
        cancel: function () {
          // TODO: 用户取消分享后执行的回调函数
        }
      });

      // 分享给朋友
      wx.onMenuShareAppMessage({
        type: 'link',
        dataUrl: '',
        title: config.title,
        link: config.link,
        imgUrl: config.imgUrl,
        desc: config.desc,
        success: function () {
          // TODO: 用户确认分享后执行的回调函数
        },
        cancel: function () {
          // TODO: 用户取消分享后执行的回调函数
        }
      });
    }
  }

  var wxShare = new WxShare();
  wxShare.getSinature();
})();
