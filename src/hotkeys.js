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

  function symbolize (key) {
    var map = {
      command   : '⌘',
      shift     : '⇧',
      left      : '←',
      right     : '→',
      top       : '↑',
      bottom    : '↓',
      'return'  : '↩',
      backspace : '⌫'
    };
    return map[key] || key;
  }

  this.$get = ['$rootElement', '$rootScope', '$compile', function ($rootElement, $rootScope, $compile) {


    $rootScope.$on('$destroy', function(a, b) {
      console.log('destroy called', a, b);
    })

    var scope = $rootScope.$new();
    scope.hotkeys = [];
    scope.helpVisible = !false;

    var helpMenu = angular.element('<div class="cfp-hotkeys" ng-show="helpVisible"><table><tbody>' +
                                      '<tr ng-repeat="hotkey in hotkeys | filter:{description: \'!undefined\'}">' +
                                        '<td class="cfp-hotkeys-keys"><span ng-repeat="key in hotkey.hotkey" class="cfp-hotkeys-key">' +
                                          '{{key}}' +
                                        '</span></td>' +
                                        '<td class="cfp-hotkeys-text">{{hotkey.description}}</td>' +
                                      '</tr>' +
                                   '</tbody></table></div>');



    // Auto-create a help menu:
    _add('?', 'Show this help menu', toggleHelp);
    angular.element(document.body).append($compile(helpMenu)(scope));
    console.log($compile(helpMenu)(scope)[0]);



    function toggleHelp() {
      scope.helpVisible = !scope.helpVisible;
    }

    function _add (hotkey, description, callback) {
      if (description instanceof Function) {
        callback = description;
        description = 'undefined';
      }

      Mousetrap.bind(hotkey, wrapApply(callback));

      // format the hotkey for display:
      hotkey = hotkey.split(/[\s]/);
      for (var i = 0; i < hotkey.length; i++) {
        switch (hotkey[i]) {
          case 'ctrl':
          case 'alt':
          case 'option':
          case 'meta':
          case 'mod':
            hotkey[i] = hotkey[i].toUpperCase();
            break;
          default:
            hotkey[i] = symbolize(hotkey[i]);
            break;
        }
      }

      scope.hotkeys.push({
        hotkey: hotkey, // for sequences, split into array for easier display
        description: description
      });
    }

    function wrapApply (callback) {
      // return mousetrap a function to call
      return function (event) {
        // this takes place outside angular, so we'll have to call
        // $apply() to make sure angular's digest happens
        $rootScope.$apply(function() {
          // call the original hotkey callback with the keyboard event
          callback(event);
        });
      };
    }

    return {
      add: _add
    };

  }];

});



})();
