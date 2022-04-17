/**
 *  跑道
 */
class Tracks {
  constructor(i, $el, queue, options) {
    this.id = i;
    this.queue = queue; // 弹幕总队列
    this.options = options;
    this.$el = $el; // 弹幕最外层容器dom
    this.isFree = true; // 是否为空闲状态
    this.isPaused = false; // 是否暂停状态

    this.timer = null; // 发射计时器
    this.waitTime = null; // 记录下一弹幕发射所需等待的时间
    this.pausedTime = null; // 记录每次暂停的时间

    this.currentBullet = {
      startTime: null, // 开始时间
    }; // 当前发射的弹幕信息
  }

  pause() {
    if (this.isPaused) {
      return;
    }
    this.pausedTime = Date.now(); // 记录暂停的时间
    this.isPaused = true;
    clearTimeout(this.timer);
  }

  start() {
    // 不是第一次开始且已经在运行状态
    if (!this.isPaused) {
      return;
    }

    this.isPaused = false;

    // 剩余还需要等待的时间 = 需要等待的时间 - 暂停前等待过的时间
    const lastWaitTime =
      this.waitTime - (this.pausedTime - this.curBullet.startTime);

    this.timer = setTimeout(() => {
      this.isFree = true;
      this.biu();
    }, lastWaitTime);
  }

  biu() {
    if (this.isPaused || !this.isFree) {
      return;
    }
    const bullet = this.queue.shift(); // 取出一条弹幕

    if (!bullet) {
      return;
    }

    this.isFree = false;
    const { text, className = "" } = bullet;
    const { touchStop } = this.options;
    const dom = document.createElement("div");

    dom.className = `bullet`;

    if (className) {
      dom.classList.add(className);
    }

    // 设置赛道
    dom.style.top = (this.id - 2) * 10 + "%";

    if (touchStop) {
      dom.classList.add("touch-stop");
    }

    dom.addEventListener("animationend", () => {
      dom.parentNode.removeChild(dom);
    });

    // 设置内容
    dom.innerText = text;

    // 加入文档流后才能获取dom宽高
    this.$el.appendChild(dom);

    const speed = 0.08;

    const s = this.$el.clientWidth + dom.clientWidth;

    const duration = s / speed; // 保证速度一致，因此运动时长肯定不一致

    dom.style.setProperty("--playDuration", duration + "ms");

    this.waitTime = dom.clientWidth / speed;

    this.curBullet = {
      startTime: Date.now(), // 发射事件
      text,
    };

    this.timer = setTimeout(() => {
      this.isFree = true;
      this.biu();
    }, this.waitTime + 100);
  }
}

class Bullet {
  constructor(options) {
    const { el = "" } = options;
    const $container = document.querySelector(el);
    if (!el || !$container) {
      throw new Error("dom not found");
    }
    const $bulletWrap = document.createElement("div"); // 外层容器
    $bulletWrap.classList.add("bullet-wrap");

    $container.appendChild($bulletWrap);
    this.$el = $bulletWrap;
    this.options = { ...options };
    this.queue = []; // 弹幕数组
    this.tracks = []; // 赛道实例数组

    this.setWrapOptions(this.options);
    this.createTracks();
  }

  /**
   * 设置容器外层的配置项
   * @param {*} options
   */
  setWrapOptions(options) {
    const { delay } = options;
    if (delay) {
      this.$el.style.setProperty("--playDelay", `${delay}ms`);
    }
  }

  /**
   *  展示弹幕
   */
  show() {
    this.$el.style.visibility = "visible";
  }

  /**
   * 隐藏弹幕
   */
  hide() {
    this.$el.style.visibility = "hidden";
  }

  /**
   * 启动
   */
  start() {
    this.$el.style.setProperty("--playState", "running");
    for (const track of this.tracks) {
      track.start();
    }
  }

  /**
   *  暂停
   */
  pause() {
    this.$el.style.setProperty("--playState", "paused");
    for (const track of this.tracks) {
      track.pause();
    }
  }

  /**
   *  创建赛道实例
   */
  createTracks() {
    let id = 1;
    while (id++ && id < 11) {
      const track = new Tracks(id, this.$el, this.queue, this.options);
      this.tracks.push(track);
    }
  }

  /**
   * 填充弹幕队列
   * @param {*} bulletList
   */
  pushBullet(bulletList) {
    this.queue.push(...bulletList);
    for (const track of this.tracks) {
      track.biu();
    }
  }
}
