// works.js —— 作品门户的筛选与排序。
//
// ── 唯一的数据来源在 HTML 里 ──────────────────────────────────────────
// 每个作品都是 index.html 中 #works-list 里的一个 <li class="work-card">，
// 带两个属性：
//   data-year="2026"        年份：用于排序；封面右上角的徽标由 CSS 读同一个值
//   data-tags="前端 后端"   标签：空格分隔，用于筛选，可写多个
// 本文件只"取用"这些属性，不新增、不改写任何作品内容。
//
// 因此：
//   · 新增作品 = 在 HTML 里复制一个 <li>，本文件一个字都不用改；
//   · 标签按钮 = 所有 data-tags 去重后自动生成，加新标签不用改代码；
//   · 作品内容只存在一份，不会出现"HTML 改了、脚本没改"这种不一致。
//
// 没有 JavaScript 时：作品照常全部显示，只是没有筛选和排序工具条。

const list = document.querySelector('#works-list')
const toolbar = document.querySelector('.works-toolbar')
const tagBox = document.querySelector('#works-tags')
const sortButton = document.querySelector('#works-sort')

function main() {
  // HTML 里没有作品门户时直接结束，不让脚本抛错影响页面其它功能。
  if (!list || !toolbar || !tagBox || !sortButton) return

  const cards = [...list.querySelectorAll('.work-card')]

  // 当前的筛选与排序状态集中放在这里，而不是散落在各个函数中：
  // 状态一改就重新应用一次，界面永远跟着状态走。
  const ALL = '全部'
  let activeTag = ''
  let newestFirst = true

  // 读出卡片的标签列表；data-tags 缺失时返回空数组，不会报错。
  const tagsOf = card => (card.dataset.tags || '').split(/\s+/).filter(Boolean)
  // 年份可能漏写，漏写时按 0 参与排序（排在最后），不要让 NaN 混进来。
  const yearOf = card => Number(card.dataset.year) || 0

  // 筛选：命中的显示，不命中的隐藏。
  // 用 hidden 属性而不是改样式：它同时作用于视觉和无障碍树，一条就够。
  function applyFilter() {
    for (const card of cards) {
      card.hidden = activeTag !== '' && !tagsOf(card).includes(activeTag)
    }
  }

  // 标签按钮：由所有作品的 data-tags 去重生成（Set 里同样的值只存一份）。
  function renderTags() {
    const tags = [ALL, ...new Set(cards.flatMap(tagsOf))]

    tagBox.replaceChildren(
      ...tags.map(name => {
        const button = document.createElement('button')
        button.type = 'button'
        button.textContent = name
        // aria-pressed 一身两职：CSS 靠它高亮当前标签，读屏软件靠它播报状态
        button.setAttribute('aria-pressed', String((activeTag || ALL) === name))
        button.addEventListener('click', () => {
          activeTag = name === ALL ? '' : name
          renderTags() // 重画按钮，更新高亮
          applyFilter() // 重画列表
        })
        return button
      }),
    )
  }

  // 排序：只调整 <li> 在 <ol> 里的先后顺序。
  // append 会把已存在的节点搬到末尾，所以是"移动"而不是"复制"——
  // 不用新建任何元素，也就不会丢掉事件和状态。
  sortButton.addEventListener('click', () => {
    newestFirst = !newestFirst
    sortButton.textContent = newestFirst ? '按年份：新→旧' : '按年份：旧→新'
    const sorted = [...cards].sort((a, b) => (newestFirst ? yearOf(b) - yearOf(a) : yearOf(a) - yearOf(b)))
    list.append(...sorted) // 一次 DOM 写入完成重排，浏览器只需重排一次
  })

  // 工具条默认在 CSS 里是隐藏的，脚本跑起来了才显示，避免无 JS 时留一条空白。
  toolbar.classList.add('is-ready')
  renderTags()
  applyFilter()
}

main()
