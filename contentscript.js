window.addEventListener("JSTrace", function (event) {
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: event.detail
  });
  console.log(event);
}, false);

var lastClicked = null;     // store the last thing we clicked so we can restore its outline

$(document).click(function(event) {
  // console.log(event.target);

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
  // console.log(clicked);
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: clicked
  });
});

$(document).dblclick(function(event) {
  // remote all parent siblings as they are probably not relevant?
  var node = $(event.target);
  _.each(node.parents(), function(element, idx, parents) {
    // console.log($(element).className);
    _.each($(element).siblings(), function(sibling, idx, siblings) {
      $(sibling).remove();
      // if ($(sibling).prop("tagName") !== "STYLE") {
      //
      //   sibling.remove();
      // }
    });
  });
});
