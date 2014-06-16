/*
 * angular-hotkeys
 *
 * Automatic keyboard shortcuts for your angular apps
 *
 * (c) 2014 Wes Cruver
 * License: MIT
 */

(function() {

  'use strict';

  angular.module('cfp.hotkeys', []).provider('hotkeys', function() {

    /**
     * Configurable setting to disable the cheatsheet entirely
     * @type {Boolean}
     */
    this.includeCheatSheet = true;

    /**
     * Cheat sheet template in the event you want to totally customize it.
     * @type {String}
     */
    this.template = '<div class="cfp-hotkeys-container fade" ng-class="{in: helpVisible}"><div class="cfp-hotkeys">' +
                      '<h4 class="cfp-hotkeys-title">{{ title }}</h4>' +
                      '<table><tbody>' +
                        '<tr ng-repeat="hotkey in hotkeys | filter:{ description: \'!$$undefined$$\' }">' +
                          '<td class="cfp-hotkeys-keys">' +
                            '<span ng-repeat="key in hotkey.format() track by $index" class="cfp-hotkeys-key">{{ key }}</span>' +
                          '</td>' +
                          '<td class="cfp-hotkeys-text">{{ hotkey.description }}</td>' +
                        '</tr>' +
                      '</tbody></table>' +
                      '<div class="cfp-hotkeys-close" ng-click="helpVisible = false">×</div>' +
                    '</div></div>';

    /**
     * Configurable setting for the cheat sheet hotkey
     * @type {String}
     */
    this.cheatSheetHotkey = '?';

    /**
     * Configurable setting for the cheat sheet description
     * @type {String}
     */
    this.cheatSheetDescription = 'Show / hide this help menu';

    this.$get = ['$rootElement', '$rootScope', '$compile', '$window', '$document', function ($rootElement, $rootScope, $compile, $window, $document) {

      // monkeypatch Mousetrap's stopCallback() function
      // this version doesn't return true when the element is an INPUT, SELECT, or TEXTAREA
      // (instead we will perform this check per-key in the _add() method)
      Mousetrap.stopCallback = function(event, element) {
        // if the element has the class "mousetrap" then no need to stop
        if ((' ' + element.className + ' ').indexOf(' mousetrap ') > -1) {
          return false;
        }

        return (element.contentEditable && element.contentEditable == 'true');
      };

      /**
       * Convert strings like cmd into symbols like ⌘
       * @param  {String} combo Key combination, e.g. 'mod+f'
       * @return {String}       The key combination with symbols
       */
      function symbolize (combo) {
        var map = {
          command   : '⌘',
          shift     : '⇧',
          left      : '←',
          right     : '→',
          up        : '↑',
          down      : '↓',
          'return'  : '↩',
          backspace : '⌫'
        };
        combo = combo.split('+');

        for (var i = 0; i < combo.length; i++) {
          // try to resolve command / ctrl based on OS:
          if (combo[i] === 'mod') {
            if ($window.navigator && $window.navigator.platform.indexOf('Mac') >=0 ) {
              combo[i] = 'command';
            } else {
              combo[i] = 'ctrl';
            }
          }

          combo[i] = map[combo[i]] || combo[i];
        }

        return combo.join(' + ');
      }

      /**
       * Hotkey object used internally for consistency
       *
       * @param {String}   combo       The keycombo
       * @param {String}   description Description for the keycombo
       * @param {Function} callback    function to execute when keycombo pressed
       * @param {string}   action      the type of event to listen for (for mousetrap)
       * @param {array}    allowIn     an array of tag names to allow this combo in ('INPUT', 'SELECT', and/or 'TEXTAREA')
       * @param {Boolean}  persistent  Whether the hotkey persists navigation events
       */
      function Hotkey (combo, description, callback, action, allowIn, persistent) {
        // TODO: Check that the values are sane because we could
        // be trying to instantiate a new Hotkey with outside dev's
        // supplied values
        this.combo = combo;
        this.description = description;
        this.callback = callback;
        this.action = action;
        this.allowIn = allowIn;
        this.persistent = persistent;
      }

      /**
       * Helper method to format (symbolize) the key combo for display
       *
       * @return {[Array]} An array of the key combination sequence
       *   for example: "command+g c i" becomes ["⌘ + g", "c", "i"]
       *
       * TODO: this gets called a lot.  We should cache the result
       */
      Hotkey.prototype.format = function() {

        var combo = this.combo;

        // if the combo is an array, it means the there are multiple bindings to
        // the same callback. Don't show all the possible key combos, just the
        // first one.  Not sure of usecase here, so open a ticket if my
        // assumptions are wrong
        if (combo instanceof Array) {
          combo = combo[0];
        }

        var sequence = combo.split(/[\s]/);
        for (var i = 0; i < sequence.length; i++) {
          sequence[i] = symbolize(sequence[i]);
        }

        return sequence;
      };

      /**
       * A new scope used internally for the cheatsheet
       * @type {$rootScope.Scope}
       */
      var scope = $rootScope.$new();

      /**
       * Holds an array of Hotkey objects currently bound
       * @type {Array}
       */
      scope.hotkeys = [];

      /**
       * Contains the state of the help's visibility
       * @type {Boolean}
       */
      scope.helpVisible = false;

      /**
       * Holds the title string for the help menu
       * @type {String}
       */
      scope.title = 'Keyboard Shortcuts:';


      $rootScope.$on('$routeChangeSuccess', function (event, route) {
        purgeHotkeys();

        if (route.hotkeys) {
          angular.forEach(route.hotkeys, function (hotkey) {
            // a string was given, which implies this is a function that is to be
            // $eval()'d within that controller's scope
            // TODO: hotkey here is super confusing.  sometimes a function (that gets turned into an array), sometimes a string
            var callback = hotkey[2];
            if (typeof(callback) === 'string' || callback instanceof String) {
              hotkey[2] = [callback, route];
            }

            // todo: perform check to make sure not already defined:
            // this came from a route, so it's likely not meant to be persistent
            hotkey[5] = false;
            _add.apply(this, hotkey);
          });
        }
      });


      // Auto-create a help menu:
      if (this.includeCheatSheet) {
        var document = $document[0];
        var element = $rootElement[0];
        var helpMenu = angular.element(this.template);
        _add(this.cheatSheetHotkey, this.cheatSheetDescription, toggleCheatSheet);

        // If $rootElement is document or documentElement, then body must be used
        if (element === document || element === document.documentElement) {
          element = document.body;
        }

        angular.element(element).append($compile(helpMenu)(scope));
      }


      /**
       * Purges all non-persistent hotkeys (such as those defined in routes)
       *
       * Without this, the same hotkey would get recreated everytime
       * the route is accessed.
       */
      function purgeHotkeys() {
        var i = scope.hotkeys.length;
        while (i--) {
          var hotkey = scope.hotkeys[i];
          if (hotkey && !hotkey.persistent) {
            _del(hotkey);
          }
        }
      }

      /**
       * Toggles the help menu element's visiblity
       */
      var previousEsc = false;

      function toggleCheatSheet() {
        scope.helpVisible = !scope.helpVisible;

        // Bind to esc to remove the cheat sheet.  Ideally, this would be done
        // as a directive in the template, but that would create a nasty
        // circular dependency issue that I don't feel like sorting out.
        if (scope.helpVisible) {
          previousEsc = _get('esc');
          _del('esc');

          // Here's an odd way to do this: we're going to use the original
          // description of the hotkey on the cheat sheet so that it shows up.
          // without it, no entry for esc will ever show up (#22)
          _add('esc', previousEsc.description, toggleCheatSheet);
        } else {
          _del('esc');

          // restore the previously bound ESC key
          if (previousEsc !== false) {
            _add(previousEsc);
          }
        }
      }

      /**
       * Creates a new Hotkey and creates the Mousetrap binding
       *
       * @param {string}   combo       mousetrap key binding
       * @param {string}   description description for the help menu
       * @param {Function} callback    method to call when key is pressed
       * @param {string}   action      the type of event to listen for (for mousetrap)
       * @param {array}    allowIn     an array of tag names to allow this combo in ('INPUT', 'SELECT', and/or 'TEXTAREA')
       * @param {boolean}  persistent  if true, the binding is preserved upon route changes
       */
      function _add (combo, description, callback, action, allowIn, persistent) {

        // used to save original callback for "allowIn" wrapping:
        var _callback;

        // these elements are prevented by the default Mousetrap.stopCallback():
        var preventIn = ['INPUT', 'SELECT', 'TEXTAREA'];

        // Determine if object format was given:
        var objType = Object.prototype.toString.call(combo);

        if (objType === '[object Object]') {
          description = combo.description;
          callback    = combo.callback;
          action      = combo.action;
          persistent  = combo.persistent;
          allowIn     = combo.allowIn;
          combo       = combo.combo;
        }

        // description is optional:
        if (description instanceof Function) {
          action = callback;
          callback = description;
          description = '$$undefined$$';
        } else if (angular.isUndefined(description)) {
          description = '$$undefined$$';
        }

        // any items added through the public API are for controllers
        // that persist through navigation, and thus undefined should mean
        // true in this case.
        if (persistent === undefined) {
          persistent = true;
        }

        // if callback is defined, then wrap it in a function
        // that checks if the event originated from a form element.
        // the function blocks the callback from executing unless the element is specified
        // in allowIn (emulates Mousetrap.stopCallback() on a per-key level)
        if (typeof callback === 'function') {

          // save the original callback
          _callback = callback;

          // make sure allowIn is an array
          if (!(allowIn instanceof Array)) {
            allowIn = [];
          }

          // remove anything from preventIn that's present in allowIn
          var index;
          for (var i=0; i < allowIn.length; i++) {
            allowIn[i] = allowIn[i].toUpperCase();
            index = preventIn.indexOf(allowIn[i]);
            if (index !== -1) {
              preventIn.splice(index, 1);
            }
          }

          // create the new wrapper callback
          callback = function(event) {
            var shouldExecute = true;
            var target = event.target || event.srcElement; // srcElement is IE only
            var nodeName = target.nodeName.toUpperCase();

            // check if the input has a mousetrap class, and skip checking preventIn if so
            if ((' ' + target.className + ' ').indexOf(' mousetrap ') > -1) {
              shouldExecute = true;
            } else {
              // don't execute callback if the event was fired from inside an element listed in preventIn
              for (var i=0; i<preventIn.length; i++) {
                if (preventIn[i] === nodeName) {
                  shouldExecute = false;
                  break;
                }
              }
            }

            if (shouldExecute) {
              wrapApply(_callback.apply(this, arguments));
            }
          };
        }

        if (typeof(action) === 'string') {
          Mousetrap.bind(combo, wrapApply(callback), action);
        } else {
          Mousetrap.bind(combo, wrapApply(callback));
        }

        scope.hotkeys.push(new Hotkey(combo, description, callback, action, allowIn, persistent));
      }

      /**
       * delete and unbind a Hotkey
       *
       * @param  {mixed} hotkey   Either the bound key or an instance of Hotkey
       * @return {boolean}        true if successful
       */
      function _del (hotkey) {
        var combo = (hotkey instanceof Hotkey) ? hotkey.combo : hotkey;

        Mousetrap.unbind(combo);

        for (var i = 0; i < scope.hotkeys.length; i++) {
          if (scope.hotkeys[i].combo === combo) {
            scope.hotkeys.splice(i, 1);
          }
        }
      }

      /**
       * Get a Hotkey object by key binding
       *
       * @param  {[string]} combo  the key the Hotkey is bound to
       * @return {Hotkey}          The Hotkey object
       */
      function _get (combo) {
        for (var i = 0; i < scope.hotkeys.length; i++) {
          if (scope.hotkeys[i].combo === combo) {
            return scope.hotkeys[i];
          }
        }
        return false;
      }

      /**
       * All callbacks sent to Mousetrap are wrapped using this function
       * so that we can force a $scope.$apply()
       *
       * @param  {Function} callback [description]
       * @return {[type]}            [description]
       */
      function wrapApply (callback) {
        // return mousetrap a function to call
        return function (event, combo) {

          // if this is an array, it means we provided a route object
          // because the scope wasn't available yet, so rewrap the callback
          // now that the scope is available:
          if (callback instanceof Array) {
            var funcString = callback[0];
            var route = callback[1];
            callback = function (event) {
              route.scope.$eval(funcString);
            };
          }

          // this takes place outside angular, so we'll have to call
          // $apply() to make sure angular's digest happens
          $rootScope.$apply(function() {
            // call the original hotkey callback with the keyboard event
            callback(event, _get(combo));
          });
        };
      }


      var publicApi = {
        add                   : _add,
        del                   : _del,
        get                   : _get,
        template              : this.template,
        toggleCheatSheet      : toggleCheatSheet,
        includeCheatSheat     : this.includeCheatSheat,
        cheatSheetHotkey      : this.cheatSheetHotkey,
        cheatSheetDescription : this.cheatSheetDescription,
        purgeHotkeys          : purgeHotkeys
      };

      return publicApi;

    }];
  })

  .directive('hotkey', function (hotkeys) {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        var key;

        angular.forEach(scope.$eval(attrs.hotkey), function (func, hotkey) {
          key = hotkey;
          hotkeys.add(hotkey, attrs.hotkeyDescription, func, attrs.hotkeyAction);
        });

        // remove the hotkey if the directive is destroyed:
        el.bind('$destroy', function() {
          hotkeys.del(key);
        });
      }
    };
  })

  .run(function(hotkeys) {
    // force hotkeys to run by injecting it. Without this, hotkeys only runs
    // when a controller or something else asks for it via DI.
  });

})();
