// app.js —— 页面交互：阅读进度条、返回顶部、导航高亮、栏目淡入。
//
// ── 三条约定，改代码前请先看一眼 ──────────────────────────────────────
// 1. 增强，不是接管。所有跳转都由原生 <a> 锚点完成，
//    脚本挂了页面照样能读、能跳，这里只负责"提示"和顺手的小功能。
// 2. JS 管状态，CSS 管样子。本文件只切换类名（.is-visible / .is-current），
//    具体外观写在 styles.css 里对应的类上，不在 JS 里写样式。
// 3. 增删栏目不用改本文件：栏目 id 和中文名都从 HTML 的导航链接里读。
//
// ── 依赖的 HTML 约定（改结构时保持一致）─────────────────────────────
//   #reading-progress    顶部进度条容器
//   #section-indicator   右下角当前栏目名
//   #to-top              返回顶部按钮
//   nav a[href^="#"]     导航项，href 必须与栏目 id 一致
//   main [id]            栏目容器
//
// 脚本用 defer 加载：它在 HTML 解析完成后才执行，页面结构已就绪。

function main() {
  const root = document.documentElement
  const progressBar = document.querySelector('#reading-progress')
  const toTopButton = document.querySelector('#to-top')
  const indicator = document.querySelector('#section-indicator')

  // 导航项和栏目都用一次查询取全，后面不再逐个找元素。
  const navLinks = [...document.querySelectorAll('nav a[href^="#"]')]
  const sections = [...document.querySelectorAll('main [id]')]

  // 上面这些元素只要缺一个，后面的逻辑就没法跑。与其让脚本在半路抛错，
  // 不如安静地什么都不做：页面少了几个装饰，正文照常可读。
  if (!progressBar || !toTopButton || !indicator || !navLinks.length) return

  // 栏目 id → 中文名。直接取导航链接上的文字，不另外维护一张对照表，
  // 这样以后在 HTML 里加一个栏目，本文件一行都不用改。
  const sectionNames = new Map(navLinks.map(link => [link.hash, link.textContent.trim()]))

  // ════════════════════════════════════════════════════════════════
  // 0. 打开动效开关
  // ════════════════════════════════════════════════════════════════
  // styles.css 里 ".js .section" 的初始态是"半透明 + 往下偏移"，
  // 由本脚本加上的 .is-visible 取消。
  // 用一个由脚本自己加上的类做开关，是为了保证：脚本没加载、加载失败或
  // 浏览器不支持观察器时，栏目就是普通的可见状态——
  // 一个半透明的页面比一个没有动画的页面糟糕得多。
  // 放在这里执行，配合 defer，能赶在首次绘制之前生效，读者不会看到闪一下。
  root.classList.add('js')

  // ════════════════════════════════════════════════════════════════
  // 1. 滚动：阅读进度条 + 返回顶部按钮
  // ════════════════════════════════════════════════════════════════
  // 这两件事必须放在同一个监听器里：滚动一秒能触发几十次，
  // 每多一个监听器就多几十次回调，能少写就少写。
  // 再加上 requestAnimationFrame 节流，保证一帧最多只处理一次，
  // 回调里的读写都发生在浏览器绘制之前，不会有卡顿。
  let ticking = false

  function syncScrollState() {
    // 已读比例 = 已经滚过的距离 ÷ 能滚的总距离。
    // 页面太短时总距离可能是 0，除以 0 得到 NaN，进度条会再也不动——
    // 凡是分母可能为 0 的地方都要先挡一下。
    const scrollable = root.scrollHeight - window.innerHeight
    const ratio = scrollable > 0 ? Math.min(window.scrollY / scrollable, 1) : 0
    progressBar.style.width = `${(ratio * 100).toFixed(2)}%`

    // 滚过大半屏才让按钮浮出来。用 innerHeight 的比例而不是写死 500px：
    // 手机屏和电脑屏高度差很多，写死的数字在一种设备上一定不合适。
    toTopButton.classList.toggle('is-visible', window.scrollY > window.innerHeight * 0.6)
  }

  function onScroll() {
    if (ticking) return
    ticking = true
    requestAnimationFrame(() => {
      ticking = false
      syncScrollState()
    })
  }

  // passive: true 告诉浏览器"这个监听器不会阻止滚动"，浏览器可以放心提前滚动。
  window.addEventListener('scroll', onScroll, { passive: true })
  // 窗口尺寸变了，能滚的总距离也变了，进度条要重算。
  window.addEventListener('resize', onScroll, { passive: true })

  toTopButton.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // 回到顶部后地址栏的 # 还停在刚才那个栏目，手动同步一下，
    // 否则右下角徽标还写着"技能"，人却已经在最上面了。
    history.replaceState(null, '', location.pathname)
    showCurrent(navLinks[0].hash)
  })

  // ════════════════════════════════════════════════════════════════
  // 2. 导航高亮 + 右下角当前栏目名
  // ════════════════════════════════════════════════════════════════
  function showCurrent(hash) {
    // 地址栏的 hash 可能是空（首次打开）或一个已删除的栏目，
    // 这时退回第一个导航项，保证永远有一个高亮项。
    const current = sectionNames.has(hash) ? hash : navLinks[0].hash

    // textContent 是"这个元素里显示的文字"。Map.get 取不到会返回 undefined，
    // 用 || '' 兜底，别让页面上出现 "undefined" 这个词。
    indicator.textContent = sectionNames.get(current) || ''

    navLinks.forEach(link => {
      const isCurrent = link.hash === current
      link.classList.toggle('is-current', isCurrent)

      // aria-current 告诉读屏软件"当前在这一项"。视觉上看不见，
      // 但在 F12 的 Elements 面板里能看到它跟着高亮移动。
      // 无障碍不是基本要求之外的额外功能，它是基本要求。
      if (isCurrent) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
  }

  // 监听 hash 变化：既覆盖了"点导航"，也覆盖了"按浏览器前进/后退键"。
  window.addEventListener('hashchange', () => showCurrent(location.hash))

  // ════════════════════════════════════════════════════════════════
  // 3. 栏目淡入 + 滚动时自动切换高亮（IntersectionObserver）
  // ════════════════════════════════════════════════════════════════
  // 同一个观察器，换一组参数就是另一种效果：
  //   下面 spy 收窄判定区，要求栏目滚到屏幕中间才算进入；
  //   下面 reveal 用阈值，栏目露出一点就算进入，淡入一次就不再管它。
  // 用它而不是在 scroll 里自己算，是因为它由浏览器底层实现，
  // 只在元素真的进出屏幕时才通知；scroll 一秒几十次，每次都算七个
  // 栏目的位置会让页面发卡。
  if ('IntersectionObserver' in window) {
    // 滚到哪个栏目，导航和徽标自己跟着换。
    const spy = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) showCurrent(`#${entry.target.id}`)
        }
      },
      // 上下各收窄 45%，只剩屏幕中间一条：栏目刚露个头就切换的话，
      // 滚动时高亮会来回乱跳。
      { rootMargin: '-45% 0px -45% 0px' },
    )
    sections.forEach(section => spy.observe(section))

    // 栏目进入屏幕时淡入上移；只淡一次，往回滚不会再淡一遍。
    const reveal = new IntersectionObserver(
      (entries, observer) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.classList.add('is-visible')
          // 已经显示过就不用再盯着它了，省性能
          observer.unobserve(entry.target)
        }
      },
      { threshold: 0.15 },
    )
    sections.forEach(section => reveal.observe(section))
  } else {
    // 安全网：浏览器不支持观察器时撤销动效开关，栏目直接正常显示。
    root.classList.remove('js')
  }

  // ════════════════════════════════════════════════════════════════
  // 4. 初始化
  // ════════════════════════════════════════════════════════════════
  // "监听变化"和"一开始先做一次"是两件事，两件都要做：
  // 别人把 index.html#skills 这样的链接直接发给你，你打开时 hash 从头到尾
  // 没有"变化"过，hashchange 根本不会触发，于是什么都不高亮。
  // 首屏也要算一次进度条，否则刷新时浏览器可能已经把你滚到中间，
  // 进度条却还是 0。
  showCurrent(location.hash)
  syncScrollState()
}

main()
