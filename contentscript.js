window.addEventListener("JSTrace", function (event) {
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: event.detail
  });
}, false);

$(document).click(function(event) {
	console.log(event.target);
	var clicked = event.target.outerHTML;

	chrome.extension.sendMessage({
	    target: "page",
	    name: "JSTrace",
	    data: clicked
  	});
});