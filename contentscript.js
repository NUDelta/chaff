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
});


var findSafePaths = function(node) {
  var safePaths = [];

  // safePaths consist of
  // all the direct ancestors of a node
  _.each(node.parents(), function(el) {
    safePaths.push($(el).getPath());
  });

  safePaths.push($('head').getPath());

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
    if ((path.indexOf("head") > -1 && path.indexOf("head") !== path.indexOf("header")) || path.indexOf("script") > -1 || path.indexOf("style") > -1) {
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

  // collect functions on page
  var functions = [];
  var functionNames = [];

  _.each(Object.keys(window), function(object) {
    if (window[object] instanceof Function) {
      functions.push(window[object]);
      functionNames.push(window[object].name || "<Anonymous function>");
    }
  });

  // console.log(functions);
  // console.log(functionNames);

  // _.each(functions, function(func) {
  //   console.log(func.name);
  // });

  // send the array of functions over
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: functionNames
  });

});
