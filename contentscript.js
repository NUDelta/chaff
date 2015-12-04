window.addEventListener("JSTrace", function (event) {
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: event.detail
  });
  console.log(event);
}, false);

// listener associated with getting own variable
window.addEventListener("message", function(event) {
  if (event.source != window) {
    return;
  }

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    console.log(event.data.text);

    // send the array of functions over
    chrome.extension.sendMessage({
      target: "page",
      name: "JSTrace",
      data: event.data.text
    });
  }
});

window.addEventListener("disable", function(event) {
  if (event.data.type && (event.data.type == "DISABLE")) {
    console.log("Request to disable " + event.data.text);
  }
});




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


// a function that collects all functions in a given namespace, to be injected and run from the DOM
var collectFunctions = function() {
  var keys = Object.keys(window);
  var functions = [];

  keys.forEach(function(key) {
    if (window[key] instanceof Function) {
      functions.push(window[key].name || "<Anonymous function>");
    }
  });

  // once you have the functions, send a message from the DOM to itself so the content script can intercept it
  window.postMessage({
    type: "FROM_PAGE",
    text: functions
  }, "*");
};

// on double click, strip away non-relevant elements
$(document).dblclick(function(event) {

  // whittle HTML that we can safely remove
  var safePaths = findSafePaths($(event.target));
  whittle(safePaths);

  // inject script to get all functions in the window
  var script = document.createElement("script");
  script.appendChild(document.createTextNode("(" + collectFunctions + ")();"));
  (document.body || document.head || document.documentElement).appendChild(script);

});
