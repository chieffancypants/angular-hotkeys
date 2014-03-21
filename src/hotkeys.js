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
          if (window.navigator && window.navigator.platform.indexOf('Mac') >=0 ) {
            combo[i] = 'command';
          } else {
            combo[i] = 'ctrl';
          }
        }

        combo[i] = map[combo[i]] || combo[i];
      }

      return combo.join(' + ');
    }

    function Hotkey (key, description, callback, persistent) {
      // TODO: Check that the values are sane because we could
      // be trying to instantiate a new Hotkey with outside dev's
      // supplied values
      this.key = key;
      this.description = description;
      this.callback = callback;
      this.persistent = persistent;
    }

    // TODO: this gets called a lot.  We should cache the result
    Hotkey.prototype.format = function() {
      // format the hotkey for display:
      var sequence = this.key.split(/[\s]/);
      for (var i = 0; i < sequence.length; i++) {
        sequence[i] = symbolize(sequence[i]);
      }

      return sequence;
    };

    this.$get = ['$rootElement', '$rootScope', '$compile', function ($rootElement, $rootScope, $compile) {

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
            if (typeof(hotkey[2]) === 'string' || hotkey[2] instanceof String) {
              hotkey[2]= [hotkey[2], route];
            }

            // todo: perform check to make sure not already defined:
            // this came from a route, so it's likely not meant to be persistent:
            hotkey[3] = false;

            _add.apply(this, hotkey);

          });
        }

        console.log(scope.hotkeys);
      });

      // TODO: Make this configurable:
      var helpMenu = angular.element('<div class="cfp-hotkeys-container fade" ng-class="{in: helpVisible}"><div class="cfp-hotkeys">' +
                                        '<h4 class="cfp-hotkeys-title">{{ title }}</h4>' +
                                        '<table><tbody>' +
                                          '<tr ng-repeat="hotkey in hotkeys | filter:{ description: \'!$$undefined$$\' }">' +
                                            '<td class="cfp-hotkeys-keys">' +
                                              '<span ng-repeat="key in hotkey.format() track by $index" class="cfp-hotkeys-key">{{ key }}</span>' +
                                            '</td>' +
                                            '<td class="cfp-hotkeys-text">{{ hotkey.description }}</td>' +
                                          '</tr>' +
                                        '</tbody></table>' +
                                      '</div></div>');



      // Auto-create a help menu:
      // TODO: Make this configurable
      _add('?', 'Show / hide this help menu', toggleHelp);
      angular.element($rootElement).append($compile(helpMenu)(scope));


      /**
       * Purges all non-persistent hotkeys (such as those defined in routes)
       *
       * Without this, the same hotkey would get recreated everytime
       * the route is accessed.
       */
      function purgeHotkeys() {
        // TODO: hotkey is used as an argument everywhere, but the object type
        // is always different.  perhaps I sohuld create a hotkey object so it
        // is consistent all the time.
        angular.forEach(scope.hotkeys, function (hotkey) {
          if (!hotkey.persistent) {
            _del(hotkey);
          }
        });
      }

      /**
       * Toggles the help menu element's visiblity
       */
      function toggleHelp() {
        scope.helpVisible = !scope.helpVisible;
      }

      /**
       * Creates a new Hotkey and creates the Mousetrap binding
       *
       * @param {string}   key         mousetrap key binding
       * @param {string}   description description for the help menu
       * @param {Function} callback    method to call when key is pressed
       * @param {boolean}  persistent  if true, the binding is preserved upon route changes
       */
      function _add (key, description, callback, persistent) {
        // a config object was passed instead, so unwrap it:
        if (key instanceof Object) {
          description = key.description;
          callback = key.callback;
          persistent = key.persistent;
          key = key.hotkey;
        }

        // description is optional:
        if (description instanceof Function) {
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

        Mousetrap.bind(key, wrapApply(callback));
        scope.hotkeys.push(new Hotkey(key, description, callback, persistent));

      }

      /**
       * delete and unbind a Hotkey
       *
       * @param  {mixed} hotkey Either the bound key or an instance of Hotkey
       * @return {boolean}        true if successful
       */
      function _del (hotkey) {
        var key = (hotkey instanceof Hotkey) ? hotkey.key : hotkey;

        Mousetrap.unbind(key);

        for (var i = 0; i < scope.hotkeys.length; i++) {
          if (scope.hotkeys[i].key === key) {
            scope.hotkeys.splice(i, 1);
          }
        }
      }

      /**
       * Get a Hotkey object by key binding
       *
       * @param  {[string]} key they key the Hotkey is bound to
       * @return {Hotkey}   The Hotkey object
       */
      function _get (key) {
        for (var i = 0; i < scope.hotkeys.length; i++) {
          if (scope.hotkeys[i].key === key) {
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
        add: _add,
        del: _del,
        get: _get,
        // TODO: when configurable, check this:
        toggleHelp: toggleHelp
      };

      return publicApi;

    }];

  }).directive('hotkey', function (hotkeys) {
    return {
      restrict: 'A',
      link: function (scope, el, attrs) {
        var keys = scope.$eval(attrs.hotkey);
        angular.forEach(keys, function (func, hotkey) {
          hotkeys.add(hotkey, attrs.hotkeyDescription, func);
        });
      }
    };
  });

})();
