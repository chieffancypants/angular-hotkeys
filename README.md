angular-hotkeys
================

Configuration-centric keyboard shortcuts for your Angular apps.

### Features:
- Automatically places tooltips over directives
- managing hotkeys per directive is too cumbersome
- managing hotkeys via directive prohibits interaction with canvas?
- prevent reuse of hotkeys
- Route aware, Should work well with Routes (but not require them)
- Automatic help hints when users hit the `?` key
- Unit tests
- when controllers are descructed, lib must remove those hotkeys
- should allow a build without mousetrap in the event it's already included
- hotkeys.add() should accept an array to make it more configuration-like


### Why I created this:
I needed keyboard shortcuts for my application, but the other projects out there relied too heavily on HTML markup for those shortcuts.  For example:

```html
<div class="player">
  <div class="playPause-btn" shortcut="{space: playPause}"></div>
  <div class="mute-btn" shortcut="{'ctrl+down': mute}"></div>
</div>
```

While this is a great approach for many Angular apps, some applications do not have a 1 to 1 relationship between DOM elements and controller methods.  In my case, many methods on the controller were **only** accessible through the keyboard.  In order to account for this, my HTML would look like this:

```html
<div class="player" shortcut="{space: playPause, 'ctrl+right': forward30, 'alt+right': forward10, 'ctrl+left': back30, 'alt+left': back10, up: volumeUp, down: volumeDown, 'ctrl+down': mute, 'ctrl+up': unmute, h: showHelp}">
  <div class="playPause-btn"></div>
  <div class="mute-btn"></div>
</div>

```

...and so on.  With a few dozen shortcuts, this left the DOM really messy, and was difficult to remember which view those shortcuts were in making maintenance a pain.


### Usage:
1. Require the lib as a dependency for your angular app:

    ```js
    angular.module('myApp', ['ngRoute', 'cfp.hotkeys']);
    ```
2. Define your keyboard shortcuts in your controller and/or app configuration:

    ```js
    angular.module('myApp').controller('NavbarCtrl', function($scope, hotkeys) {
      $scope.volume = 50;

      hotkeys.add('ctrl+up', function() {
        $scope.volume += 10;
      });
    });
    ```


