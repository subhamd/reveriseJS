import { style } from './style'
import { getObject, setObject } from './storage-man'

/*
  This module handles localization widget creation,
  style injection and event handling related to widget functionality.
*/
let target_lang = 'english'
let language_change_handler = false

const widgetHTML =
`<ul>
  <li>
    <h3>
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="60" height="40" viewBox="0 0 1469 1024">
        <path fill="#ffffff" d="M413.945 115.202c-1.283 3.416-52.107 136.896-113.19 296.85-60.863 159.954-110.834 291.51-110.834 292.148s25.63 0.854 57.022 0.638l57.238-0.638 21.782-59.8c12.172-32.885 25.84-70.686 30.754-83.928l8.756-23.922h101.018c94.176 0 101.018 0.216 102.51 3.632 0.638 2.139 13.242 38.44 27.76 80.728s27.122 78.588 27.76 80.512c1.070 2.994 4.054 3.848 11.318 3.848h10.039l-30.97 31.176-30.97 30.97 13.88 12.81c33.1 30.538 62.362 47.834 100.802 60.438 30.538 10.039 52.32 12.81 89.484 11.318 48.050-1.708 81.797-12.604 113.398-36.516 37.802-28.406 57.66-60.863 65.14-105.926l3.416-21.36 10.894 1.492c14.096 2.139 57.444 2.139 68.978 0l9.184-1.492 0.428 112.543 0.638 112.758 54.028 0.638 53.818 0.428v-518.95h111.050v-96.1h-318.205v96.1h98.24l-0.428 95.462-0.638 95.246-11.75 4.27c-8.328 2.778-19.65 4.486-38.44 5.124-41.434 1.708-65.14-4.908-98.662-27.551l-14.312-9.61 5.34-5.124c10.248-9.61 28.192-39.294 34.17-56.384 4.486-13.242 6.194-22.214 6.832-39.726 1.708-45.488-11.102-80.086-41.002-109.558-33.74-33.532-71.756-48.050-126.432-48.266-52.752 0-101.018 19.22-134.756 53.818-8.972 9.184-16.442 16.442-16.658 16.229-0.216-0.428-21.782-58.946-48.050-130.486l-47.628-129.632h-110.412l-2.346 5.762zM499.797 350.122c17.084 49.12 30.754 89.906 30.322 90.76-0.428 1.070-29.684 1.708-64.924 1.708-48.482 0-63.854-0.638-63.854-2.562 0-3.632 64.924-178.967 66.2-178.967 0.638 0 15.166 40.148 32.246 89.052zM665.736 419.532c15.588 13.88 29.046 25.198 30.116 25.198 0.854 0 5.762-5.762 10.894-12.81 16.229-22.42 32.885-31.824 59.584-33.532 41.641-2.994 66.416 18.366 66.416 57.238 0 22.214-4.702 34.596-17.939 47.834-16.442 16.442-30.322 20.29-72.826 20.29h-33.1v39.932l-0.216 40.148-39.294-106.78c-21.782-58.73-39.51-107.209-39.51-107.634 0-1.283 5.978 3.848 35.878 30.116zM817.791 627.109c16.658 5.34 30.538 15.804 36.516 28.406 7.473 15.166 7.264 41.641-0.428 58.514-11.102 23.49-30.116 36.307-60.863 40.58-40.364 5.556-81.366-8.54-110.834-38.44l-10.464-10.894h36.732c20.29 0 36.732-0.428 36.732-0.854 0-0.638-2.994-8.972-6.617-18.795s-10.248-28.192-14.95-40.786l-8.328-23.274 45.272 1.070c34.808 0.638 48.266 1.708 57.238 4.486z"></path>
      </svg>
    </h3>
  </li>
  <li>
    <ul id="rev-select">
      <li data-lang="english"><a href="#english" data-nolocalize="true">English</a></li>
      <li data-lang="hindi"><a href="#hindi" data-nolocalize="true">Hindi</a></li>
      <li data-lang="punjabi"><a href="#punjabi" data-nolocalize="true">Punjabi</a></li>
      <li data-lang="gujarati"><a href="#gujarati" data-nolocalize="true">Gujarati</a></li>
    </ul>
  </li>
 </ul>`;

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
  widgetElement.id = "rev-lang"

  widgetElement.innerHTML = widgetHTML
  document.body.appendChild(widgetElement)

  // collapse the languages list initially
  let langList = widgetElement.querySelector('#rev-select'),
  computedStyle = window.getComputedStyle(langList)
  langList.style.visibility = 'hidden' //to hide the animated effect
  //save the actual height in data attribute
  langList.dataset.height = computedStyle.height.slice(0, -2)
  // make the height 0 by default
  langList.style.height = 0
  langList.style.visibility = 'visible'
  langList.dataset.collapsed = true

  let selectedLi = `#rev-select li[data-lang=${ settings.currentLang == 'value' ? 'english': settings.currentLang }]`

  document.querySelector(selectedLi)
  .className = 'active'

  // collapse/reveal logic
  document.querySelector('#rev-lang ul h3').addEventListener('click', function(e) {
    let ul = document.querySelector('#rev-lang ul ul'),
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

  document.querySelectorAll('#rev-select li a').forEach(a => a.addEventListener('click', e => e.preventDefault()))
  document.querySelectorAll('#rev-select li').forEach((li, index, all_li) => {
    li.addEventListener('click', function(e) {
      let language = this.dataset.lang
      all_li.forEach((li) => li.className = '')
      this.className = 'active'
      if(language_change_handler) language_change_handler(language)
    })
  })
}

export function setLanguageChangeHandler(cb) {
  language_change_handler = cb
}
