angular-hotkeys
================

Configuration-centric keyboard shortcuts for your Angular apps.

## This is currently under development
I wouldn't recommend using this in production yet, unless you're me -- in which case, hit it hard because you're behind schedule, wes.

* * *

### Features:
- Define hotkeys on an entire route, automatically binding and unbinding them as you navigate
- Automatic listing of shortcuts when users hit the `?` key
- Super duper unit tests


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

#### Binding hotkeys in controllers:

```js
angular.module('myApp').controller('NavbarCtrl', function($scope, hotkeys) {
  $scope.vol = 5;

  // Pass it an object:
  hotkeys.add({
    hotkey: 'ctrl+up',
    description: 'This one goes to 11',
    callback: function() {
      $scope.volume += 1;
    };
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

