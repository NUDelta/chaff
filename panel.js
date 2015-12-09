var runInPage = function (fn, callback) {
  var args = Array.prototype.slice.call(arguments, 2);
  var evalCode = "(" + fn.toString() + ").apply(this, " + JSON.stringify(args) + ");";
  chrome.devtools.inspectedWindow.eval(evalCode, {}, callback);
};

function requestDisable(functionName) {
  console.log("Disabling function: " + functionName);
  window.disabledFunctions = window.disabledFunctions || {};
  window.disabledFunctions[functionName] = window[functionName];
  window[functionName] = null;
}

function requestEnable(functionName) {
  console.log("Enabling function: " + functionName);
  window[functionName] = window.disabledFunctions[functionName];
}

$(document).ready(function () {
  var tabId = chrome.devtools.inspectedWindow.tabId;
  var panelPort = chrome.extension.connect({name: "gravelpanel"});
  panelPort.postMessage({
    name: "identification",
    data: tabId
  });

  panelPort.onMessage.addListener(function (message) {
    if (message && message.target == "page" && message.name == "JSTrace") {

      // create a list of checkboxes, one for each function, that when unchecked will enable/disable a function
      $('.functions').empty();
      for (var i = 0; i < message.data.length; i++) {
        // create the checkbox
        $('<input/>', {
          type: 'checkbox',
          id: 'cb'+i,
          value: message.data[i],
          "checked": "checked"
        }).appendTo($('.functions'));

        $('<label/>', {
          for: 'cb'+i,
          text: message.data[i]
        }).appendTo($('.functions'));

        $('<br/>').appendTo($('.functions'));

        // behavior handler
        $('#cb' + i + ":checkbox").change(function(e) {
          console.log(e);
          if (e.target.checked) {
            runInPage(requestEnable, function() { console.log(arguments); }, e.target.value);
          } else {
            runInPage(requestDisable, function() { console.log(arguments); }, e.target.value);
          }
        });
      }
    }
  });
});
