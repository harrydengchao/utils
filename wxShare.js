;(function() {
  var wxClient = /MicroMessenger/i.test(navigator.userAgent);

  var operationEnv = {
    localhost: /^localhost|^\d{1,}\.\d{1,}\.\d{1}/i.test(location.hostname),
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
    API[key] = originEnv.use + API[key];
  }

  /*------------------------------------------------------------------*/

  function WxShare() {
    this.config = {
      debug: false,
      signature: '',
      jsApiList: [
        'onMenuShareTimeline',
        'onMenuShareAppMessage'
      ]
    }

    this.getSinature = function () {
      if (!wxClient || operationEnv.localhost) {
        window.weui.topTips('请在微信中打开');
        return undefined
      }

      if (this.config.signature) {
        // 已获取签名
        this.verify();
        return true
      }

      var _loading = window.weui.loading('数据加载...');
      var that = this;
      window.$.ajax({
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

          that.config = Object.assign({}, that.config, res.data);
          that.verify();
        },
        error: function (err) {

        },
        complete: function () {
          _loading.hide();
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
      var config = {
        title: '绑定资金账号，带您三分钟把握投资机遇',
        link: location.href,
        imgUrl: img,
        desc: '泰九微刊，三分钟把握最新全盘投资机遇，绑定资金账号即可领取。'
      };

      // 检查signature存在
      if (!this.config.signature) {
        this.getSinature();
        return undefined
      }

      // 分享到朋友圈
      wx.onMenuShareTimeline(Object.assign({}, config, {
        success: function () {
          // TODO: 用户确认分享后执行的回调函数
        },
        cancel: function () {
          // TODO: 用户取消分享后执行的回调函数
        }
      }));

      // 分享给朋友
      wx.onMenuShareAppMessage(Object.assign({}, config, {
        type: 'link',
        dataUrl: '',
        success: function () {
          // TODO: 用户确认分享后执行的回调函数
        },
        cancel: function () {
          // TODO: 用户取消分享后执行的回调函数
        }
      }));
    }
  }

  $(function () {
    var wxShare = new WxShare();
    wxShare.getSinature();
  })
})();
