angular-hotkeys 
================
Configuration-centric keyboard shortcuts for your Angular apps.

[![Coverage Status](https://coveralls.io/repos/chieffancypants/angular-hotkeys/badge.png?branch=master)](https://coveralls.io/r/chieffancypants/angular-hotkeys?branch=master)
![Build Status](https://magnum-ci.com/status/89743485de3e7311dfc9793e26f39b41.png)

### Features:
- Define hotkeys on an entire route, automatically binding and unbinding them as you navigate
- Automatic listing of shortcuts when users hit the `?` key
- Super duper unit tests


### Installation:

#### via bower:

```
$ bower install chieffancypants/angular-hotkeys --save
```

#### via npm:

```
$ npm install angular-hotkeys --save
```


### Why I made this:
Other projects out there rely too heavily on HTML markup for keyboard shortcuts.  For example:

```html
<div class="player">
  <div class="playPause-btn" shortcut="{space: playPause}"></div>
  <div class="mute-btn" shortcut="{'ctrl+down': mute}"></div>
</div>
```

While this is a great approach for many Angular apps, some applications do not have a 1 to 1 relationship between DOM elements and controller methods.  In my case, many methods on the controller were **only** accessible through the keyboard.

Additionally, this only allows you to pass a function reference, you can't pass arguments to the function you intend to call. So instead of simply calling `seek(currentTime + 30)` and `seek(currentTime + 60)`,  I needed to create a ton of helper functions on the scope (such as `forward30` and `forward60`), and litter my HTML like this:

```html
<div class="player" shortcut="{space: playPause,
                              'alt+right': forward30,
                              'ctrl+right': forward60,
                              'left': back30,
                              'ctrl+left': back60,
                              up: volumeUp,
                              down: volumeDown,
                              'ctrl+down': mute,
                              'ctrl+up': unmute,
                              f: fullscreen,
                              h: showHelp}">
  <div class="playPause-btn"></div>
  <div class="mute-btn"></div>
</div>

```

With a few dozen shortcuts, this left the DOM really messy, and with multiple views and directive templates, it was next to impossible to remember where all the different shortcuts were.  This became a maintenance nightmare.


### Usage:

You can either define hotkeys in your Controller, or in your Route configuration (or both).  To start, though, require the lib as a dependency for your angular app:

```js
angular.module('myApp', ['ngRoute', 'cfp.hotkeys']);
```

Behind the scenes, I'm using the [Mousetrap](https://github.com/ccampbell/mousetrap) library to manage the key bindings.  Check out the docs there for more information on what kind of key combinations can be used.


#### Binding hotkeys in controllers:

```js
angular.module('myApp').controller('NavbarCtrl', function($scope, hotkeys) {
  $scope.volume = 5;

  // Pass it an object:
  hotkeys.add({
    combo: 'ctrl+up',
    description: 'This one goes to 11',
    callback: function() {
      $scope.volume += 1;
    }
  });

  // or pass it arguments:
  hotkeys.add('ctrl+down', 'Turn the volume down on this hotness', function() {
    $scope.volume -= 1;
  });

});
```

#### Binding hotkeys in routes:
You can also define hotkeys on an entire route, and this lib will bind and unbind them as you navigate the app.

```js
angular.module('myApp').config(function ($routeProvider) {
  $routeProvider.when('/', {
    controller: 'RestaurantsController',
    templateUrl: 'views/restaurants.html',
    hotkeys: [
      ['p', 'Sort by price', 'sort(price)']
    ]
  });
});
```

#### Binding hotkeys in directives:
Lastly, even though binding hotkeys in your templates/html tends to be a bad idea, it can be super useful for simple shortcuts.  Think along the lines of a modal directive where you simply want to bind to the escape key or something equally simple.  Accomplishing this within a controller is too much overhead, and it may lead to code-reuse.

Example of how directive-based hotkeys works:

```html
<modal title="Modal Title" hotkey="{esc: close}">
```

### Configuration

**Disable the cheatsheet:**

Disabling the cheatsheet can be accomplished by configuring the `hotkeysProvider`:

```js
angular.module('myApp', ['cfp.hotkeys'])
  .config(function(hotkeysProvider) {
    hotkeysProvider.includeCheatSheet = false;
  })
```

**Cheatsheet template:**

```js
angular.module('myApp', ['cfp.hotkeys'])
  .config(function(hotkeysProvider) {
    hotkeysProvider.template = '<div class="my-own-cheatsheet">...</div>';
  })
```

### API

#### hotkeys.add(combo, description, callback)

- `combo`: They keyboard combo (shortcut) you want to bind to
- `description`: [OPTIONAL] The description for what the combo does and is only used for the Cheat Sheet.  If it is not supplied, it will not show up, and in effect, allows you to have unlisted hotkeys.
- `callback`: The function to execute when the key(s) are pressed.  Passes along two arguments, `event` and `hotkey`

```js
hotkeys.add('ctrl+w', 'Description goes here', function (event, hotkey) {
  event.preventDefault();
});

// this hotkey will not show up on the cheat sheet:
hotkeys.add('ctrl+y', function (event, hotkey) {
  event.preventDefault();
});
```

#### hotkeys.add(object)
- `object`: An object version of the above parameters.

```js
hotkeys.add({
  combo: 'ctrl+w',
  description: 'Description goes here',
  callback: function(event, hotkey) {
    event.preventDefault();
  }
});
```

#### hotkeys.get(key)
Returns the Hotkey object

```js
hotkeys.get('ctrl+w');
// -> Hotkey { combo: 'ctrl+w', description: 'Description goes here', callback: function (event, hotkey) }
```

#### hotkeys.del(key)
Removes and unbinds a hotkey

```js
hotkeys.del('ctrl+w');
```

### Allowing hotkeys in form elements
By default, Mousetrap prevents hotkey callbacks from firing when their event originates from an `input`, `select`, or `textarea` element. To enable hotkeys in these elements, specify them in the `allowIn` parameter:
```js
hotkeys.add({
  combo: 'ctrl+w',
  description: 'Description goes here',
  allowIn: ['INPUT', 'SELECT', 'TEXTAREA'],
  callback: function(event, hotkey) {
    event.preventDefault();
  }
});
```
