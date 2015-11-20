window.addEventListener("JSTrace", function (event) {
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: event.detail
  });
  console.log(event);
}, false);


// single click simply highlights the element
// store the last thing we clicked so we can restore its outline afterwards
var lastClicked = null;
$(document).click(function(event) {
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
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: clicked
  });
});


var findSafePaths = function(node) {
  var safePaths = [];

  // safePaths consist of
  // all the direct ancestors of a node
  _.each(node.parents(), function(el) {
    safePaths.push($(el).getPath());
  });

  // the node itself
  safePaths.push(node.getPath());

  // and ALL its children
  _.each(node.find('*'), function(child) {
    safePaths.push($(child).getPath());
  });

  return safePaths;

};


// using safePath, whittle away everything that's not in it or not CSS/JS
var whittle = function (safePaths) {
  var trashEls = [];

  $('*').each(function (i, el) {
    var path = $(el).getPath();
    if (path.indexOf("head") > -1 || path.indexOf("script") > -1 || path.indexOf("style") > -1) {
      return;
    }

    if (safePaths.indexOf(path) < 0) {
      trashEls.push(el);
    }
  });

  trashEls.forEach(function (el, index, array) {
    $(el).remove();
  });
};


// on double click, strip away non-relevant elements
$(document).dblclick(function(event) {
  var node = $(event.target);
  var safePaths = findSafePaths(node);
  whittle(safePaths);

});
