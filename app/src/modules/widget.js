import { style } from './style'
import { getObject, setObject } from './storage-man'
import { languages, available_langs} from './langs'

/*
  This module handles localization widget creation,
  style injection and event handling related to widget functionality.
*/
let target_lang = 'english'
let language_change_handler = false

const widgetHTML =
`
  <div data-nolocalize="true" id="reverise-container--header">
    English
  </div>
  <ul>
    <li data-nolocalize="true" data-lang="english">English</li>
    <li data-nolocalize="true" data-lang="hindi">हिन्दी</li>
    <li data-nolocalize="true" data-lang="punjabi">ਪੰਜਾਬੀ</li>
    <li data-nolocalize="true" data-lang="tamil">தமில்</li>
    <li data-nolocalize="true" data-lang="telugu">டெல்யூஜ்</li>
  </ul>
`;

// call this method from window.onload
export default function create() {
  let settings = getObject('__settings__')

  // inject widget styles
  let styleElement = document.createElement('style'),
      styleContent = document.createTextNode(style);
  styleElement.appendChild(styleContent)
  document.head.appendChild(styleElement)

  // inject widget html
  let widgetElement = document.createElement('div')
  widgetElement.id = "reverise-container"

  widgetElement.innerHTML = widgetHTML
  document.body.appendChild(widgetElement)

  // collapse the languages list initially
  let langList = widgetElement.querySelector('#reverise-container ul'),
  computedStyle = window.getComputedStyle(langList)
  langList.style.visibility = 'hidden' //to hide the animated effect
  //save the actual height in data attribute
  langList.dataset.height = computedStyle.height.slice(0, -2)
  // make the height 0 by default
  langList.style.height = 0
  langList.style.visibility = 'visible'
  langList.dataset.collapsed = true

  let selectedLi = `#reverise-container ul li[data-lang=${ settings.currentLang == 'value' ? 'english': settings.currentLang }]`

  document.querySelector(selectedLi)
  .className = 'active'

  document.querySelector('#reverise-container #reverise-container--header').textContent = document.querySelector(selectedLi).textContent

  // collapse/reveal logic
  document.querySelector('#reverise-container #reverise-container--header').addEventListener('click', function(e) {
    let ul = document.querySelector('#reverise-container ul'),
    is_collapsed = ul.dataset.collapsed,
    height = ul.dataset.height

    if(is_collapsed == 'true') {
      ul.style.height = height + 'px'
      ul.dataset.collapsed = false
    } else {
      ul.style.height = '0px'
      ul.dataset.collapsed = true
    }
  }, true)

  document.querySelectorAll('#reverise-container ul li').forEach(a => a.addEventListener('click', e => e.preventDefault()))
  document.querySelectorAll('#reverise-container ul li').forEach((li, index, all_li) => {
    li.addEventListener('click', function(e) {
      let language = this.dataset.lang
      all_li.forEach((li) => li.className = '')
      this.className = 'active'
      document.querySelector('#reverise-container #reverise-container--header').textContent = this.textContent
      if(language_change_handler) language_change_handler(language)
    })
  })
}

export function setLanguageChangeHandler(cb) {
  if(typeof cb === 'function')
    language_change_handler = cb

  if(typeof cb === 'string' && ( available_langs.indexOf(cb) != -1 ) ) {
    document.querySelectorAll('#reverise-container ul li').forEach(function(li, index, all_li) {
      if(li.dataset.lang === cb) {
        li.className = 'active'
        document.querySelector('#reverise-container #reverise-container--header').textContent = this.textContent
      }
      else li.className = ''
    })
  }
}
