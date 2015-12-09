// Initial message to establish communiation between contenscript and background page (I think)
window.addEventListener("JSTrace", function (event) {
  chrome.extension.sendMessage({
    target: "page",
    name: "JSTrace",
    data: event.detail
  });
  console.log(event);
}, false);


/*
 * ON A SINGLE CLICK
 * Highlight the DOM element we've clicked with a red outline
 * Save the previous outline, so we can restore it if we click elsewhere
 */
var lastClicked = null;
$(document).click(function(event) {
  if (lastClicked) {
    lastClicked.target.style.border = lastClicked.originalBorder;   // restore the old border, if applicable
  }

  lastClicked = {
    target: event.target,
    originalBorder: event.target.style.border
  };

  event.target.style.border = "1px dashed red";                     // set the new border to red
});


/*
 * ON DOUBLE CLICK
 * Strip away non-relevant HTML
 * Send a list of Javascript functions to the dev panel
 * Basically call all the helper functions below
 */
$(document).dblclick(function(event) {
  var safePaths = findSafePaths($(event.target));
  whittle(safePaths);

  var script = document.createElement("script");                    // Addendum to step (1) below - inject the inline script
  script.appendChild(document.createTextNode("(" + collectFunctions + ")();"));
  (document.body || document.head || document.documentElement).appendChild(script);
});

/*
 * The "safe path" for a given DOM node consists of any elements that can't be
 * deleted without fundamentally altering its internal appearance
 * Ask Josh Hibschman regarding any questions
 */
var findSafePaths = function(node) {
  var safePaths = [];

  safePaths.push($('head').getPath());                              // the head usually contains vital stylesheets

  _.each(node.parents(), function(parent) {
    safePaths.push($(parent).getPath());
  });

  safePaths.push(node.getPath());                                   // obviously we want the node itself

  _.each(node.find('*'), function(child) {
    safePaths.push($(child).getPath());
  });

  return safePaths;
};

/*
 * "Whittle" away everything not in safePath or a script/stylesheets
 * Ask Josh Hibschman regarding any questions
 */
function whittle(safePaths) {
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
}

/*
 * Because the contentscript is sandboxed from the original web page, we need to
 * "cheat" to get the functions on the page:
 *
 * 1) Create a function that stores all globally available functions from its current
 *    namespace by inspecting it's own window - this will be injected into the page
 *    as an inline script, giving it access to the web page's namespace
 * 2) Have this function then send a message from the DOM to itself with the list of
 *    functions it has gathered
 * 3) Create another function in the contentscript to intercept this message,
 *    allowing it "pseudo" access to the page's namespace.
 */
function collectFunctions() {
  var keys = Object.keys(window);
  var functions = [];

  keys.forEach(function(key) {
    if (window[key] instanceof Function) {                          // Step (1)
      functions.push(window[key].name || "<Anonymous function>");   // anonymous function support does not currently exist
    }
  });

  window.postMessage({                                              // Step (2)
    type: "FROM_PAGE",
    text: functions
  }, "*");
}

window.addEventListener("message", function(event) {                // Step (3)
  if (event.source != window) {
    return;
  }

  if (event.data.type && (event.data.type == "FROM_PAGE")) {
    console.log(event.data.text);

    // send the array of functions over to the actual dev panel
    chrome.extension.sendMessage({
      target: "page",
      name: "JSTrace",
      data: event.data.text
    });
  }
});
