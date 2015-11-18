window.addEventListener("JSTrace", function (event) {
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: event.detail
  });
}, false);

var lastClicked = null;     // store the last thing we clicked so we can restore its outline

$(document).click(function(event) {
  console.log(event.target);

  // restore outline of last clicked item
  if (lastClicked) {
    lastClicked.target.style.border = lastClicked.previousBorderAttribute;
  }

  // save outline of the thing we just clicked for later
  lastClicked = {
    target: event.target,
    previousBorderAttribute: event.target.style.border
  };

  event.target.style.border = "1px dashed red";

  // send the serialized HTML to the extension
  var clicked = event.target.outerHTML;
  console.log(clicked);
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: clicked
  });

});
