<template>


    <div id="dplayer" ref="dplayer" :style="{ height: viewportHeight +'px', width: '100%' }">

    </div>

</template>
<script>
import DPlayer from 'dplayer';
import _ from 'lodash';
// https://dplayer.diygod.dev/zh/guide.html

export default {
  name: 'VideoComponent',
  props: ['videoType'],
  data() {
    return {
      viewportHeight: window.innerHeight,
      resizeTimeout: null,
      mode: 'light',
      dp: null,
      hls: null,
      comment_input: undefined,
      scroll_comment_timer: null,
      isPositive: true,
    }
  },
  mounted() {
    this.updateHeight();

    window.addEventListener('resize', this.handleResize);
    window.addEventListener('orientationchange', this.handleResize);

    // 创建播放器
    this.dp = new DPlayer({
      container: this.$refs.dplayer,
      danmaku: {
        id: '1',
        api: 'https://api.blue6.top/video',
        type: "top",
      },
      preload: "meta",
      video: {
        url: 'https://api.dogecloud.com/player/get.mp4?vcode=5ac682e6f8231991&userId=17&ext=.mp4',
        // type: 'customHls',
        // customType: {
        //   customHls: (video, player) => {
        //     if (!this.hls) {
        //       this.hls = new Hls({
        //         xhrSetup: function (xhr, url) {
        //           console.log(xhr)
        //           xhr.withCredentials = true; // 会携带cookie
        //           xhr.setRequestHeader('token', "my-token")
        //         },
        //         maxBufferLength: 10,        // 最大缓存1秒，极限减少预加载流量
        //         maxMaxBufferLength: 10,     // 最大缓冲限制，防止播放器忽略 maxBufferLength
        //         backBufferLength: 10,      // 播放过的缓存保留15秒，回退不卡且不重新请求
        //       });
        //     }
        //     this.hls.loadSource(video.src);
        //     this.hls.attachMedia(video);
        //   },
        // },
      }
    });

    // this._observer = new MutationObserver(this.obPlayedWidth);
    //
    // this._observer.observe(this.dp.bar.elements['played'], {
    //   attributes: true,
    //   attributeFilter: ['style'],
    //   attributeOldValue: true  // 关键：必须设置这个，MutationRecord.oldValue才会有值
    // });




    // 重写
    this.dp.comment.send = ()=> {
      var player = this.dp.comment.player;
      player.template.commentInput.blur();
      if (!player.template.commentInput.value.replace(/^\s+|\s+$/g, '')) {
        player.notice(player.tran('please-input-danmaku'));
        return;
      }

      // 发送事件给 父组件， 等父组件 收到后端 ack 再去发送真正的消息
      this.$emit('sendMessage',{
        text: player.template.commentInput.value,
        color: this.color2Number(player.container.querySelector('.dplayer-comment-setting-color input:checked').value),
        type: parseInt(player.container.querySelector('.dplayer-comment-setting-type input:checked').value),
        isDisplay: true
      });
      // 清空输入框内容
      player.template.commentInput.value = ""
    }

    this.dp.on('webfullscreen', () => {
      document.body.classList.add('fullscreen-active');
      // 你还可以这里写其他UI逻辑，比如关闭加载动画等
    });

    this.dp.on('webfullscreen_cancel', () => {
      document.body.classList.remove('fullscreen-active');
    });

    this.dp.on('loadeddata', () => {
       this.$emit('loadSuccess')
     // alert('视频切换成功并可以播放')
      // 你可以在这里做加载动画关闭、UI更新等
    })

    this.comment_input = document.querySelector('.dplayer-comment-input');
    this.comment_input.addEventListener('focus', this.scrollToComment);
    this.dp.on('pause', ()=>{
      if (this.isPositive) {
        this.$emit('pause', this.dp.video.currentTime)
      } else {
        this.isPositive = true;
      }});
    this.dp.on('play', ()=>{
      if (this.isPositive) {
        this.$emit('play', this.dp.video.currentTime)
      } else {
        this.isPositive = true;
      }});



    this.dp.on('seeking', ()=>{

      if (this.isPositive) {
        let width = this.dp.bar.elements['played'].style.width;
        let time = parseFloat(width) / 100 * this.dp.video.duration;
        if (time) {
          this.$emit('seeked', parseFloat(width) / 100 * this.dp.video.duration)
        }
      } else {
        this.isPositive = true;
      }

    });

  },
  methods: {
    // obPlayedWidth: _.debounce(function (mutations) {
    //   for (const m of mutations) {
    //     if (m.attributeName === 'style' && m.target.style.width !== this.playedValue) {
    //       // 主动触发 就发送事件。
    //       if (this.isPositive) {
    //         let time = parseFloat(m.target.style.width) / 100 * this.dp.video.duration;
    //         this.playedValue = m.target.style.width;
    //         if (time) {
    //           this.$emit('seeked', parseFloat(m.target.style.width) / 100 * this.dp.video.duration)
    //         }
    //       } else {
    //         this.isPositive = true;
    //       }
    //     }
    //   }
    //
    // }, 100),
    switchVideo(url) {

      this.dp.switchVideo(
          {
            url,
            // type: 'customHls',
            // customType: {
            //   customHls: (video, player) => {
            //     if (!this.hls) {
            //       this.hls = new Hls({
            //         xhrSetup: function (xhr, url) {
            //           // xhr.withCredentials = true; // 会携带cookie  console.log(xhr)
            //
            //         },
            //         maxBufferLength: 10,        // 最大缓存1秒，极限减少预加载流量
            //         maxMaxBufferLength: 10,     // 最大缓冲限制，防止播放器忽略 maxBufferLength
            //         backBufferLength: 10,      // 播放过的缓存保留15秒，回退不卡且不重新请求
            //       });
            //     }
            //     this.hls.loadSource(video.src);
            //     this.hls.attachMedia(video);
            //   },
            // },
          }
          // {
          //   id: 'test',
          //   api: 'https://api.prprpr.me/dplayer/',
          //   maximum: 3000,
          //   user: 'DIYgod',
          // }
      );

    },
    updateHeight() {
      this.viewportHeight = window.innerHeight;
    },
    handleResize: _.debounce(function() {
      // 清理之前的定时器，避免频繁执行
      clearTimeout(this.resizeTimeout);

      // 立即更新一次
      this.updateHeight();
      if (this.resizeTimeout) {
        this.resizeTimeout = null;
      }
      // 延时再更新一次，保证iOS地址栏变化后高度准确
      this.resizeTimeout = setTimeout(() => {
        this.updateHeight();
      }, 500);
    }, 300),
    color2Number(color) {
      if (color[0] === '#') {
        color = color.substr(1);
      }
      if (color.length === 3) {
        color = ''.concat(color[0]).concat(color[0]).concat(color[1]).concat(color[1]).concat(color[2]).concat(color[2]);
      }
      return parseInt(color, 16) + 0 & 16777215;
    },
    scrollToComment(){
      this.clearTimeout();
      // 强制滚动到可见区域
      this.scroll_comment_timer = setTimeout(() => {

        // 获取目标元素的位置
        const rect = window.scrollY + this.comment_input.getBoundingClientRect();
        // console.log("滑动了", rect)
        window.scrollTo({
          top: rect.top,
          behavior: 'smooth',
        });
      }, 100);
    },
    clearTimeout(){
      if (this.scroll_comment_timer) {
        clearTimeout(this.scroll_comment_timer);
        this.scroll_comment_timer = null;
      }
    },
    sendMessage(message, self) {

      if (message.color) {
        message.color = parseInt(message.color)
      }
      if (message.type) {
        message.type = parseInt(message.type)
      }
      message.time = this.dp.video.currentTime,
      console.log("显示弹幕：", message)
      this.dp.danmaku.draw(message);
    },
    // 下面的四个方法都是给 父组件执行的，不是触发事件后执行的。 是收到 ws 指令
    play(){
      this.isPositive = false;
      this.dp.play();
    },
    pause(){
      this.isPositive = false;
      this.dp.pause();
    },
    seeked(time){
      // 防止重复触发 跳转进度条事件
      // 这里触发的事件就是 被动触发。
      // 下面方法执行完毕后，会触发 seeked 事件，又发送事件给父组件，死循环
      this.isPositive = false;
      this.dp.seek(time);
    },
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('orientationchange', this.handleResize);
    clearTimeout(this.resizeTimeout);

    this.clearTimeout();
    this.comment_input.removeEventListener('focus', this.scrollToComment);
    if (this.dp) {
      console.log("销毁了")
      this.dp.destroy();
      this.dp = null;
      // this.hls.destroy();
      this.hls = null;
    }
  }
}
</script>

<style>
.fullscreen-active {
  background-color: black !important;
}
/* 底部滑动用的空白块（撑开页面，制造下滑空间） */
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
}

</style>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style lang="scss">





.dplayer-danmaku {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  font-size: 22px;
  color: #fff;

  .dplayer-danmaku-item {
    display: inline-block;
    pointer-events: none;
    user-select: none;
    cursor: default;
    white-space: nowrap;
    text-shadow: .5px .5px .5px rgba(0, 0, 0, .5);

    &--demo {
      position: absolute;
      visibility: hidden;
    }
  }

  .dplayer-danmaku-right {
    position: absolute;
    right: 0;
    transform: translateX(100%);

    &.dplayer-danmaku-move {
      will-change: transform;
      animation: danmaku 5s linear;
      animation-play-state: paused;
    }
  }

  @keyframes danmaku {
    from {
      transform: translateX(100%);
    }
  }

  .dplayer-danmaku-top,
  .dplayer-danmaku-bottom {
    position: absolute;
    width: 100%;
    text-align: center;
    visibility: hidden;

    &.dplayer-danmaku-move {
      will-change: visibility;
      animation: danmaku-center 4s linear;
      animation-play-state: paused;
    }
  }

  @keyframes danmaku-center {
    from {
      visibility: visible;
    }
    to {
      visibility: visible;
    }
  }
}
</style>
