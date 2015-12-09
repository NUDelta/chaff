### Gravel
##### A Chrome extension focused on creating a sandbox for developers to tinker with websites by enabling and disabling Javascript functions.

##### Installation Instructions
1. Clone the repository
2. Enable developer mode in Chrome from the extensions page
3. Load the extension from folder

##### Usage Instructions
1. Single click and note the red outline, this denotes the component you will isolate
2. Double clicking will isolate that component's HTML, stripping away all other HTML
3. The Sandpaper panel in Chrome Dev Tools will populate with a list of functions
4. By checking and unchecking, you can disable and re-enable those functions

##### How it works
Because the contentscript is sandboxed from the original web page, we need to "cheat" to get the functions on the page:

1. Create a function that stores all globally available functions from its current namespace by inspecting the keys of its own window - this will be injected into the page as an inline script, giving it access to the web page's namespace
2. Have this function then send a message from the DOM to itself with the list of functions it has gathered
3. Create another function in the contentscript to intercept this message. It's important to note that the contentscript has its own namespace, but it can access the web page's DOM, including all messages, allowing it indirectly. access to the page's namespace
4. This information is forwarded to the Chrome extension

How enabling and disabling functions works

1. Since the dev panel has eval access to the web page's namespace, this is pretty straightforward. The disable function finds the name of the function that has been unchecked, and finds it in the window. It saves a copy of it in some object, then renames the function to null, effectively removing it.
2. The enable function does the opposite, bringing the function back to the appropriate variable.

##### Limitations (1, 2, 3 are addressed in the video)
1. The app strips HTML, which can sometimes mess with what JS functions expect from the DOM. It doesn't break isolation, but it can make things a bit clunky.
2. The app doesn't seem to get all Javascript. I couldn't get it to work with Facebook.
3. The app doesn't have bulk enable/disable features, which would be very handy.
4. It doesn't currently support anonymous functions, since there is no way to reference them by eval. One potential solution is to modify the function object and give it a name (or an id attribute, maybe the hash of the function body?), and use this as a key somehow. Not sure.
5. Undefined behavior for external libraries. I don't know what will happen.
