<template>
  <div>


    <div class="center-box">
      <h1>播放室</h1>
      <div>解析的动漫官网_<a href="https://www.mgnacg.com/bangumi">橘子动漫</a></div>
      <div>使用说明：点进上方的动漫官网，进入一个动漫，复制链接。比如：https://www.mgnacg.com/media/1452/，后面的【1452】就是下方的动漫id</div>
      <h2 style="color: blue">欢迎【{{ this.user }}】当前房间人数：{{ this.people }}</h2>


      <!--<div>-->
      <!--  <button @click="changeVideoType">点我切换{{ this.videoType == 'hls' ? 'MP4格式' : 'HLS格式' }}</button>-->
      <!--</div>-->

      <div>
        <!--当前播放列表id：<input v-model="videoId" style="width: 20px"/>-->
        当前播放链接：<input v-model="currentUrl"/>
        <button @click="update_url" class="custom-style">同步该链接到其他人</button>
      </div>

      <div>
        <div>
          动漫id：<input v-model="comic_info.videoId" style="width: 50px"/>
        </div>
        <div>
          <select v-model="comic_info.loadId">
            <option disabled value="">请选择</option>
            <option v-for="item in line_list" :key="item.value" :value="item.value">
              {{ item.label }}
            </option>
          </select>

        </div>
        <div>
          开始集数-结束集数：
          <input v-model="comic_info.start" style="width: 10px"/>-<input v-model="comic_info.end" style="width: 10px"/>
        </div>
        <div style="color: red">
          集数越多，解析时间越久。解析后的视频链接一般只有一两个小时有限时间。
        </div>
        <button @click="refresh_url" class="custom-style">解析上述设置视频链接</button>
        <div style="color: red">
          一集大约解析30秒，这段时间后会解析完成，需要手动点击下方按钮，重新获取视频列表。
        </div>
        <button @click="getPlayList" class="custom-style">更新视频列表</button>
        <div>

        </div>
      </div>
      <div>
      </div>

      <div style="height: 300px; overflow-y: auto; border: 1px solid #ccc;">
        <ul @click="handlePlayList">
          <li v-for="(item, index) in this.playList" :data-id="index"
              :class="{ active: selectedIndex == index }"
          >视频名：{{ item.name }}
          </li>
        </ul>
      </div>



    </div>
    <div class="dpalyer-wrapper">
      <VideoComponent ref="videoComponent1"
                      :videoType="videoType"
                      @sendMessage="sendMessage"
                      @seeked="seeked"
                      @pause="pause"
                      @play="play"
                      @loadSuccess="loadSuccess"
      ></VideoComponent>
    </div>
  </div>
</template>

<script>

import { getPlayList, refreshPlayList } from "@/api/index"
import VideoComponent from "@/components/VideoComponent.vue";
import { v4 as uuidV4 } from 'uuid'
import logger from '@/utils/logger.js';

class Duplicator {
  constructor(expireMs = 6000) {
    this.map = new Map();
    this.expireMs = expireMs;
    this.timerId = setInterval(() => this.clean(), this.expireMs);
  }

  add(id) {
    this.map.set(id, Date.now());
  }

  has(id) {
    return this.map.has(id);
  }

  clean() {
    const now = Date.now();
    for (const [id, time] of this.map) {
      if (now - time > this.expireMs) this.map.delete(id);
    }
  }

  destroy() {
    clearInterval(this.timerId);
    this.map.clear();
  }
}


export default {
  name: 'VideoHome',
  components: {VideoComponent},
  props: ['user'],
  data() {
    return {
      comic_info: {
        start: 1,
        end: 1,
        videoId: 972,
        loadId: '0'
      },
      videoType: "hls",
      videoId: "",
      line_list: [
        {value: '0', label: '线路1'},
        {value: '1', label: '线路2'},
        {value: '2', label: '线路3'},
      ],
      playList: [],
      selectedIndex: undefined,
      people: 0,
      currentUrl: "/blue",
      // currentUrl: "/loadVideo/user/2013/4/Attack-on-Titan/16.mp4?Authorization=3_20250520015145_44bab4807d1cc8601f05b634_d8084dc5edb4ccc946b409b5d981780db58a2657_005_20250521015145_0034_dnld",
      ws: null,
      // 发送心跳定时器
      heart_interval: null,
      // 发送心跳间隔
      heart_timeout: 7000,
      // 收到服务端心跳 定时器
      heart_check_timeout: null,
      reconnect_timer: null,
      messageQueue: new Map(),
      messageQueueInterval: null,
      messageQueueTimeout: 3000,
      // 接收消息队列，用于判断去重消息
      receiveMap: new Duplicator(6000)
    }
  },
  mounted() {
    this.init_ws();
    this.getPlayList();
  },
  methods: {
    changeVideoType() {
      if (this.videoType == 'hls') {
        this.videoType = 'mp4'
      } else {
        this.videoType = 'hls'
      }
    },
    // 点击事件
    handlePlayList(event) {
      let target = event.target;
      if (target && target.dataset.id) {
        this.selectedIndex = target.dataset.id;
        this.currentUrl = this.playList[target.dataset.id].url;
        this.update_url();
      }
    },
    getPlayList() {

      getPlayList(this.user, this.videoId).then((data) => {
        this.playList = data;
      }).catch((err) => {
        this.$router.replace({
          name: 'login'
        })
        alert("播放清单获取错误【非法登陆】：" + err)

      })

    },
    init_ws() {
      //判断当前浏览器是否支持WebSocket
      if ('WebSocket' in window) {
        //连接WebSocket节点
        this.ws = new WebSocket(process.env.VUE_APP_WS_BASE + "?user=" + this.user);
      } else {
        alert('Not support websocket')
      }

      //连接成功建立的回调方法
      this.ws.onopen = () => {
        logger.info("连接成功");
        // 消息重发 定时器
        this.messageQueueInterval = setInterval(() => {
          const now = Date.now();
          for (const [id, item] of this.messageQueue.entries()) {
            if (now - item.timestamp > this.messageQueueTimeout && item.retryCount < 3) {
              logger.log(`重发消息 ${id}`);
              item.timestamp = now;
              item.retryCount++;
              this.sendMessage(item, true);
            } else if (item.retryCount >= 3) {
              logger.warn(`消息 ${id} 超过重试次数`);
              this.messageQueue.delete(id);
            }
          }
        }, 1000);

        this.stopHeart();
        this.startHeart();
      }

      //接收到消息的回调方法
      this.ws.onmessage = (event) => {
        logger.log("收到消息：", event.data)
        let result = JSON.parse(event.data)
        let msType = result.msType;
        if (msType != "pong" && this.receiveMap.has(result.messageId)) {
          return;
        }
        if (msType == "pong") {
          // 收到后端发的消息 pong，更新下超时
          logger.log("pong")
          // 清除 检测 pong 的计时器
          if (this.heart_check_timeout) {
            clearTimeout(this.heart_check_timeout)
            this.heart_check_timeout = null;
          }
          this.people = result.text;
        } else if (msType == 'ack' && result.messageId) {
          // 后端收到消息，发送确认信息
          result = this.messageQueue.get(result.messageId);
          if (result) {
            if (!result.isDisplay) {
            } else {
              // 弹幕显示
              result.text = "我说：【" + result.text + "】";
              this.$refs.videoComponent1.sendMessage(this.messageQueue.get(result.messageId), true);
            }
            this.messageQueue.delete(result.messageId);
            logger.log(`消息 ${result.messageId} 已确认`);
          }

        } else {
          if (msType == 'seeked') {
            this.$refs.videoComponent1.seeked(result.text);
            result.text = result.user + "调整了视频进度";
          } else if (msType == 'play') {
            this.$refs.videoComponent1.play();
            result.text = result.user + "选择播放视频";

          } else if (msType == 'pause') {
            this.$refs.videoComponent1.pause();
            result.text = result.user + "选择暂停视频";

          } else if (msType == 'next') {
            // 子组件写了 watch 监听这个 props
            let nextResult = JSON.parse(result.text);
            this.videoId = nextResult.playlistId
            // 同步了 id 就要重新获取列表。
            // 防止会两次数据一样，先重置为空。

            this.currentUrl = nextResult.url;
            this.swithVideo()
            this.getPlayList();
            this.selectedIndex = nextResult.id;
            result.text = result.user + "切换下一个视频【同步链接】";
          } else if (msType == 'enter') {
            this.people = result.text;
            result.text = `【${result.user}】加入房间，当前房间人数【${this.people}】`;
            result.type = 0;
          } else {
            result.text = result.user + "说：【" + result.text + "】";

          }
          // 显示消息到 视频页面
          this.$refs.videoComponent1.sendMessage(result);
          this.receiveMap.add(result.messageId);
          logger.log("响应消息：", {
            messageId: result.messageId,
            msType: "ack"
          })
          this.ws.send(JSON.stringify({
            messageId: result.messageId,
            msType: "ack"
          }));
          // this.ws.send(JSON.stringify({
          //   messageId: result.messageId,
          //   msType: "ack",
          // }), false)
        }
      }

      //连接发生错误的回调方法
      this.ws.onerror = (e) => {
        logger.log("ws发生错误", e)
        this.ws.close(); // 触发 onclose
      };

      //连接关闭的回调方法
      this.ws.onclose = (e) => {
        if (e.code == '4001') {
          logger.error("禁止多端登录");
          alert("禁止多端登录");
          this.$router.replace({
            path: "/"
          })
        } else {
          logger.log("ws已关闭，触发重连")
        }
        // 重连：多端登录禁止重连
        this.tryConnect(e.code != '4001');
      }
    },
    startHeart() {
      logger.info("开启ping")
      // 发送心跳包，每 heart_timeout 秒发送一次

      this.heart_interval = setInterval(() => {
        if (this.ws.readyState === WebSocket.OPEN) {
          // 发送心跳
          this.ws.send(JSON.stringify({user: this.user, msType: "ping", text: "ping"}));
          this.heart_check_timeout = setTimeout(() => {
            logger.warn("pong timeout，断线重连");
            this.tryConnect();
            ; // 或者重连逻辑
          }, this.heart_timeout)
        } else {
          logger.warn("心跳异常：触发重连");
          // 发送心跳，但是 ws 状态不对，尝试重连【在此之后可能会触发 error 或 close 事件，仅保证重连一次】
          // 虽然会触发这两个事件，但可能不是及时触发
          this.tryConnect();
        }
      }, this.heart_timeout);
    },
    stopHeart() {
      logger.log("停止ping")
      if (this.heart_interval) {
        clearInterval(this.heart_interval);
        this.heart_interval = null;
      }
    },
    tryConnect(flag = true) {
      // 清理 ws，移除监听器，否则 多个事件 触发的 重连机制，会导致多次重连上一次的 ws 实例的事件
      // 只要 null 后，即使加入了事件循环里，也不会执行该方法。
      this.cleanWs();
      // 关闭心跳定时器和 上一个的重连定时器
      this.clear_interval();
      if (flag) {
        this.reconnect_timer = setTimeout(() => {
          logger.info("尝试重连")
          this.init_ws();
        }, 3000); // 3秒后尝试重连
      }
    },
    cleanWs() {
      if (this.ws) {
        this.ws.onopen = null;    // 移除事件监听
        this.ws.onmessage = null;
        this.ws.onerror = null;
        this.ws.onclose = null;
        this.ws = null;    // 释放 WebSocket 实例
      }
    },
    clear_interval() {
      this.stopHeart();
      if (this.reconnect_timer) {
        clearTimeout(this.reconnect_timer)
        this.reconnect_timer = null;
      }
      if (this.messageQueueInterval) {
        clearTimeout(this.messageQueueInterval)
        this.messageQueueInterval = null;
      }
      if (this.heart_check_timeout) {
        clearTimeout(this.heart_check_timeout)
        this.heart_check_timeout = null;
      }
    },
    update_url() {
      this.swithVideo();
      this.sendMessage({
        msType: "next",
        text: {
          playlistId: this.videoId,
          url: this.currentUrl,
          id: this.selectedIndex
        },
        isDisplay: false
      }, false)
      this.getPlayList();
      // this.currentUrl = '/下载2.mp4';

      //alert("同步成功");
    },

    refresh_url() {
      refreshPlayList(this.user, "", this.comic_info).then((data) => {
      }).catch((err) => {
        this.$router.replace({
          name: 'login'
        })
        alert("播放清单获取错误【非法登陆】：" + err)
      })
    },

    /**
     *
     * @param flag 当前消息是否 是重发  的消息
     */
    sendMessage(message, flag = false) {
      message.user = this.user;
      if (!message.messageId) {
        message.messageId = uuidV4()
      }
      if (!message.msType) {
        message.msType = 'text';
      }
      logger.log("发出消息：", JSON.stringify(message))
      // 发送到客户端
      this.ws.send(JSON.stringify(message));
      // 进入消息队列
      let data = {};
      if (!flag) {
        data = Object.assign(data, message, {
          timestamp: Date.now(),
          retryCount: 0,
        })
      } else {
        data = message;
      }
      this.messageQueue.set(message.messageId, message);
    },
    seeked(time) {
      // 进度跳转
      logger.log("seeked");
      this.sendMessage({
        msType: "seeked",
        text: time,
        isDisplay: false,
      })
    },
    pause() {
      logger.log("pause")
      this.sendMessage({
        msType: "pause",
        isDisplay: false
      })
    },
    play() {
      logger.log("play")
      this.sendMessage({
        msType: "play",
        isDisplay: false
      })
    },
    loadSuccess() {
      this.sendMessage({
        msType: "loadSuccess",
        text: "视频加载成功",
        isDisplay: false
      }, false)
    },
    cleanUp() {
      logger.log("销毁")
      this.receiveMap.clean();
      // 销毁之前，也没来得及执行 ws.close 事件， 所以销毁前关闭链接。清除掉 ws 的事件，否则会一直执行，
      this.clear_interval();
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();  // 关闭连接
      }
      this.cleanWs();
      logger.error("页面离开，销毁ws")
    },
    swithVideo() {
      logger.info("切换视频链接", this.currentUrl)
      this.$refs.videoComponent1.switchVideo(this.currentUrl);
    }
  },
  beforeDestroy() {
    this.cleanUp();
  }
}


</script>

<style scoped>

button:active {
  transform: translateY(2px); /* 向下移动一点 */
  box-shadow: 0 2px 0 #2980b9; /* 阴影变浅，模拟按下效果 */
}

div + div {
  margin-top: 10px;

}



ul {
  padding: 0;
  margin: 0;

}

li {
  list-style-type: none;
  cursor: pointer;
  border-top: 2px dashed #888; /* 虚线分割线 */
  padding-top: 10px; /* 虚线和上面列表间距 */
  padding-bottom: 10px; /* 虚线和上面列表间距 */
}

ul li:first-child {
  /* 第一个 li */
  border-top: none;
  margin-top: 0px;
}

ul li:last-child {
  /* 最后一个 li */
  margin-bottom: 0;
}

li.active {
  background-color: #409eff; /* 蓝色高亮背景 */
  color: white; /* 字体变白 */
}

.dpalyer-wrapper {
  display: flex;
  justify-content: center; /* 水平居中 */
  align-items: center; /* 垂直居中（如果需要） */
}

.center-box {
  text-align: center; /* 水平居中 */
}
</style>
