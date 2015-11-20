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
    if (path.indexOf("head") > -1 && path.indexOf("head") !== path.indexOf("header")) {
      return;
    }
    if (path.indexOf("script") > -1 || path.indexOf("style") > -1) {
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


// strip CSS
var stripCSS = function() {
  var css = "";
  if (document.styleSheets && document.styleSheets.length) {

    // iterate over stylesheets
    for (var i = 0; i < document.styleSheets.length; i++) {
      if (document.styleSheets[i] && document.styleSheets[i].cssRules) {
        var cssRules = document.styleSheets[i].cssRules;

        // iterate over css rules
        for (var j = 0; j < cssRules.length; j++) {
          var keepRule = false;
          var mediaRuleText = "";

          try {
            var selectorText = cssRules[j].selectorText;
            var selectors = selectorText.split(",");

            keepRule = !!_(selectors).find(function (selector) {
              var checkText = selector.indexOf(':') > -1 ? selector.substr(0, selector.indexOf(':')) : selector;
              return !!$(checkText).length;
            });

          } catch (err) {
            if (cssRules[j] instanceof CSSMediaRule) {
              var subRulesToRemove = [];

              var mediaRule = cssRules[j];
              var innerCSSRules = mediaRule.cssRules;
              for (var k = 0; k < innerCSSRules.length; k++) {
                var innerMediaRule = innerCSSRules[k];
                var innerSelectorText = innerMediaRule.selectorText;

                try {
                  var innerSelectors = innerSelectorText.split(",");
                  var innerExists = !!_(innerSelectors).find(function (selector) {
                    var checkText = selector.indexOf(':') > -1 ? selector.substr(0, selector.indexOf(':')) : selector;
                    return !!$(checkText).length;
                  });
                  if (!innerExists) {
                    subRulesToRemove.push(innerMediaRule.cssText);
                  }
                } catch (err) {
                }
              }
              keepRule = false;

              if (innerCSSRules.length === subRulesToRemove.length) {
                mediaRuleText = "";
              } else {
                mediaRuleText = cssRules[j].cssText;
                for (var l = 0; l < subRulesToRemove.length; l++) {
                  mediaRuleText = mediaRuleText.replace(subRulesToRemove[l], "");
                }
              }
            } else {
              keepRule = true;
            }
          }

          if (keepRule) {
            css += cssRules[j].cssText + "\n";
          } else if (mediaRuleText) {
            css += mediaRuleText;
          } else {
            console.log(cssRules[j]);
          }
        }
      }
    }
  }

  return css;
};

// on double click, strip away non-relevant elements
$(document).dblclick(function(event) {
  var node = $(event.target);
  var safePaths = findSafePaths(node);
  whittle(safePaths);
  // console.log(stripCSS());
});
