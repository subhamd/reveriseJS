
var textNodes = [];
var dictionary = {};
var rejectTextFilter = {
  acceptNode: function(node) {
    if (node.parentNode.nodeName !== 'SCRIPT'&&node.parentNode.nodeName !== 'STYLE') {
      return NodeFilter.FILTER_ACCEPT;
    }
  }
};
function nativeTreeWalker() {
    var walker = document.createTreeWalker(
        document,
        NodeFilter.SHOW_TEXT,
        rejectTextFilter,
        false
    );
    while(node = walker.nextNode()) {

      var t=node.nodeValue.trim()

        if( t.length>2){
          node.nodeValue=t
          textNodes.push(node.nodeValue)
          //console.log(t);
        }

    }
    localize(textNodes)
};

function localize(inarr){
	var input={}
  input.data=inarr;
  var str = JSON.stringify(input)
  //console.log(str);
var xhr = new XMLHttpRequest();


xhr.addEventListener("readystatechange", function () {
  if (this.readyState === 4) {
    var it = JSON.parse(this.responseText)
    for(var i=0; i<it.responseList.length;i++)
      dictionary[it.responseList[i].inString]=it.responseList[i].outString
    //console.log(dictionary);
    localizeNow(dictionary);

  }
});

xhr.open("POST", "https://api-revup.reverieinc.com/apiman-gateway/reverieinc/localization/1.0?target_lang=hindi&source_lang=english&domain=3");
xhr.setRequestHeader("rev-api-key", "FE7JP7xAYGR8lB5XIFBEDYLxzbkWvyL8fD1E");
xhr.setRequestHeader("rev-app-id", "com.nilout");
xhr.setRequestHeader("content-type", "application/json");


xhr.send(str);

}
function localizeNow(dict){
var walker = document.createTreeWalker(
        document,
        NodeFilter.SHOW_TEXT,
        rejectTextFilter,
        false
    );



    while(node = walker.nextNode()) {

      var t=node.nodeValue.trim()

        if( t.length>2){
          node.nodeValue=t
          node.nodeValue = dict[t]
          //console.log(t);
        }

    }

}



	$("#revLang h3").click(function(){

		//slide up all the link lists
		$("#revLang ul ul").slideUp();
		//slide down the link list below the h3 clicked - only if its closed
		if(!$(this).next().is(":visible"))
		{
			$(this).next().slideDown();
		}
	})
  $("#revSelect li").click(function(){
    var language = this.textContent
    nativeTreeWalker()
  })
