$(document).ready(() => {


  $(`<ul class="rev-localizer-popup">
      <li><a>Localize</a></li>
      <li><a href="#">English</a></li>
      <li><a href="#">Hindi</a></li>
      <li><a href="#">Bengali</a></li>
      <li><a href="#">Assamese</a></li>
    </ul>`).appendTo($('body'))

  $('.rev-localizer-popup li a').each(function(index) {
    if(index == 0) {
      $(this).click(function() {
        var totalHeight = $('.rev-localizer-popup').height()
        var minusOneLi = $('.rev-localizer-popup li:eq(0)').height();
        console.log(totalHeight + ' ' + minusOneLi)
      })
    }
    if(index > 0) {
      $(this).click(function(e) {
        e.preventDefault()
        $('.rev-localizer-popup li a').removeClass('active')
        $(this).addClass('active')
      })
    }
  })

})
