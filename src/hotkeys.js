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

  var helpMenu = angular.element('<div class="cfp-hotkeys">')

  this.$get = ['$window', '$rootScope', function ($window, $rootScope) {

    var hotkeys = [];

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

    // Auto-create a help menu:
    Mousetrap.bind('?', wrapApply(function (event) {
      hotkeys.push({
        hotkey: '?',
        description: 'Show this help menu'
      });
      console.log('? was pressed', hotkeys);
    }));

    return {
      add: function(hotkey, description, callback) {
        if (description instanceof Function) {
          callback = description;
          description = '';
        }

        hotkeys.push({
          hotkey: hotkey,
          description: description
        });
        Mousetrap.bind(hotkey, wrapApply(callback));
      }
    };

  }];

});



})();
