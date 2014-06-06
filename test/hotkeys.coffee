
describe 'Angular Hotkeys', ->

  hotkeys = scope = $rootScope = $rootElement = $window = null

  beforeEach ->
    module 'cfp.hotkeys'

    result = null
    inject (_$rootElement_, _$rootScope_, _hotkeys_) ->
      hotkeys = _hotkeys_
      $rootElement = _$rootElement_
      $rootScope = _$rootScope_
      scope = $rootScope.$new()

  afterEach ->
    hotkeys.del('w')
    t = document.getElementById('cfp-test')
    if t
      t.parentNode.removeChild(t)

  it 'should insert the help menu into the dom', ->
    children = angular.element($rootElement).children()
    expect(children.hasClass('cfp-hotkeys-container')).toBe true

  it 'add(args)', ->
    hotkeys.add 'w', 'description here', ->
    expect(hotkeys.get('w').description).toBe 'description here'
    expect(hotkeys.get('x')).toBe false

  it 'add(object)', ->
    callback = false
    hotkeys.add
      combo: 'w'
      description: 'description'
      callback: () ->
        callback = true

    expect(hotkeys.get('w').description).toBe 'description'

    # Test callback:
    expect(callback).toBe false
    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(callback).toBe true

  it 'description should be optional', ->
    # func argument style:
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'

    # object style:
    hotkeys.add
      combo: 'e'
      callback: ->

    expect(hotkeys.get('e').description).toBe '$$undefined$$'

  it 'del()', ->
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'
    hotkeys.del 'w'
    expect(hotkeys.get('w')).toBe false

  it 'should toggle help when ? is pressed', ->
    expect(angular.element($rootElement).children().hasClass('in')).toBe false
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(angular.element($rootElement).children().hasClass('in')).toBe true

  it 'should bind esc when the cheatsheet is shown', ->
    expect(hotkeys.get('esc')).toBe false
    expect(angular.element($rootElement).children().hasClass('in')).toBe false
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(angular.element($rootElement).children().hasClass('in')).toBe true
    expect(hotkeys.get('esc').combo).toBe 'esc'
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(hotkeys.get('esc')).toBe false

  it 'should remember previously bound ESC when cheatsheet is shown', ->
    expect(hotkeys.get('esc')).toBe false

    # bind something to escape:
    hotkeys.add 'esc', 'temp', () ->
    expect(hotkeys.get('esc').description).toBe 'temp'
    originalCallback = hotkeys.get('esc').callback

    # show the cheat-sheet which will overwrite the esc key. however, we want to
    # show the original combo description in the callback, yet have the new
    # callback bound to remove the cheatsheet from view.
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(hotkeys.get('esc').description).toBe 'temp'
    expect(hotkeys.get('esc').callback).not.toBe originalCallback

    # hide the cheat sheet to verify the previous esc binding is back
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    expect(hotkeys.get('esc').description).toBe 'temp'

  it 'should (un)bind based on route changes', ->
    # fake a route change:
    expect(hotkeys.get('w e s')).toBe false
    $rootScope.$broadcast('$routeChangeSuccess', { hotkeys: [['w e s', 'Do something Amazing!', 'callme("ishmael")']] });
    expect(hotkeys.get('w e s').combo).toBe 'w e s'

    # ensure hotkey is unbound when the route changes
    $rootScope.$broadcast('$routeChangeSuccess', {});
    expect(hotkeys.get('w e s')).toBe false

  it 'should callback when the hotkey is pressed', ->
    executed = false

    hotkeys.add 'w', ->
      executed = true

    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(executed).toBe true

  it 'should callback according to action', ->
    keypressA = false;
    keypressB = false;

    hotkeys.add 'a', ->
      keypressA = true
    , 'keyup'

    hotkeys.add 'b', ->
      keypressB = true

    KeyEvent.simulate('a'.charCodeAt(0), 90)
    KeyEvent.simulate('b'.charCodeAt(0), 90)
    expect(keypressA).toBe false
    expect(keypressB).toBe true
    expect(hotkeys.get('a').action).toBe 'keyup'

  it 'should run routes-defined hotkey callbacks when scope is available', ->
    executed = false
    passedArg = null

    $rootScope.callme = (arg) ->
      executed = true
      passedArg = arg

    $rootScope.$broadcast '$routeChangeSuccess',
      hotkeys: [['w', 'Do something Amazing!', 'callme("ishmael")']]
      scope: $rootScope

    expect(executed).toBe false
    KeyEvent.simulate('w'.charCodeAt(0), 90)
    expect(executed).toBe true
    expect(passedArg).toBe 'ishmael'

  it 'should callback when hotkey is pressed in input field and allowIn INPUT is configured', ->
    executed = no

    $body = angular.element document.body
    $input = angular.element '<input id="cfp-test"/>'
    $body.prepend $input

    hotkeys.add
      combo: 'w'
      allowIn: ['INPUT']
      callback: -> executed = yes

    KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $input[0])
    expect(executed).toBe yes

  it 'should callback when hotkey is pressed in select field and allowIn SELECT is configured', ->
    executed = no

    $body = angular.element document.body
    $select = angular.element '<select id="cfp-test"/>'
    $body.prepend $select

    hotkeys.add
      combo: 'w'
      allowIn: ['SELECT']
      callback: -> executed = yes

    KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $select[0])
    expect(executed).toBe yes

  it 'should callback when hotkey is pressed in textarea field and allowIn TEXTAREA is configured', ->
    executed = no

    $body = angular.element document.body
    $textarea = angular.element '<textarea id="cfp-test"/>'
    $body.prepend $textarea

    hotkeys.add
      combo: 'w'
      allowIn: ['TEXTAREA']
      callback: -> executed = yes

    KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $textarea[0])
    expect(executed).toBe yes

  it 'should not callback when hotkey is pressed in input field without allowIn INPUT', ->
    executed = no

    $body = angular.element document.body
    $input = angular.element '<input id="cfp-test"/>'
    $body.prepend $input

    hotkeys.add
      combo: 'w'
      callback: -> executed = yes

    KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $input[0])
    expect(executed).toBe no

  it 'should not callback when hotkey is pressed in select field without allowIn SELECT', ->
    executed = no

    $body = angular.element document.body
    $select = angular.element '<select id="cfp-test"/>'
    $body.prepend $select

    hotkeys.add
      combo: 'w'
      callback: -> executed = yes

    KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $select[0])
    expect(executed).toBe no

  it 'should not callback when hotkey is pressed in textarea field without allowIn TEXTAREA', ->
    executed = no

    $body = angular.element document.body
    $textarea = angular.element '<textarea id="cfp-test"/>'
    $body.prepend $textarea

    hotkeys.add
      combo: 'w'
      callback: -> executed = yes

    KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $textarea[0])
    expect(executed).toBe no

  it 'should callback when the mousetrap class is present', ->
    executed = no

    $body = angular.element document.body
    $input = angular.element '<input class="mousetrap" id="cfp-test"/>'
    $body.prepend $input

    hotkeys.add
      combo: 'a'
      callback: -> executed = yes

    KeyEvent.simulate('a'.charCodeAt(0), 90, undefined, $input[0])
    expect(executed).toBe yes




  it 'should support multiple hotkeys to the same function', ->
    executeCount = 0

    hotkeys.add ['a', 'b'], ->
      executeCount++

    KeyEvent.simulate('a'.charCodeAt(0), 90)
    expect(executeCount).toBe 1
    KeyEvent.simulate('b'.charCodeAt(0), 90)
    expect(executeCount).toBe 2


describe 'hotkey directive', ->

  el = scope = hotkeys = $compile = $document = null

  beforeEach ->
    module('cfp.hotkeys')
    inject ($rootScope, _$compile_, _$document_, _hotkeys_) ->
      hotkeys = _hotkeys_
      $compile = _$compile_
      # el = angular.element()
      scope = $rootScope.$new()
      el = $compile('<div hotkey="{dir: callme}"></div>')(scope)
      scope.$digest()

  it 'should allow hotkey binding via directive', ->
    expect(hotkeys.get('dir').combo).toBe 'dir'

  it 'should unbind the hotkey when the directive is destroyed', ->




describe 'Platform specific things', ->
  beforeEach ->
    windowMock =
      navigator:
        platform: 'Macintosh'

    module 'cfp.hotkeys'

  it 'should display mac key combos', ->
    module ($provide) ->
      $provide.value '$window', angular.extend window,
        navigator:
          platform: 'Macintosh'
      return

    inject (hotkeys) ->
      hotkeys.add 'mod+e', 'description'
      expect(hotkeys.get('mod+e').format()[0]).toBe '⌘ + e'

  it 'should display win/linux key combos', ->
    module ($provide) ->
      $provide.value '$window', angular.extend window,
        navigator:
          platform: 'Linux x86_64'
      return

    inject (hotkeys) ->
      hotkeys.add 'mod+e', 'description'
      expect(hotkeys.get('mod+e').format()[0]).toBe 'ctrl + e'


describe 'Configuration options', ->

  it 'should disable the cheatsheet when configured', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.includeCheatSheet = false
      return
    inject ($rootElement, hotkeys) ->
      children = angular.element($rootElement).children()
      expect(children.length).toBe 0

  it 'should enable the cheatsheet when configured', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.includeCheatSheet = true
      return
    inject ($rootElement, hotkeys) ->
      children = angular.element($rootElement).children()
      expect(children.length).toBe 1

  it 'should accept an alternate template to inject', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.template = '<div class="little-teapot">boo</div>'
      return
    inject ($rootElement, hotkeys) ->
      children = angular.element($rootElement).children()
      expect(children.hasClass('little-teapot')).toBe true

  it 'should run and inject itself so it is always available', ->
    module 'cfp.hotkeys'

    inject ($rootElement) ->
      children = angular.element($rootElement).children()
      expect(children.hasClass('cfp-hotkeys-container')).toBe true

  it 'should attach to body if $rootElement is document (#8)', inject ($rootElement) ->

    injected = angular.element(document.body).find('div')
    expect(injected.length).toBe 0

    injector = angular.bootstrap(document, ['cfp.hotkeys'])
    injected = angular.element(document.body).find('div')
    expect(injected.length).toBe 3
    expect(injected.hasClass('cfp-hotkeys-container')).toBe true

  it 'should have a configurable hotkey and description', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.cheatSheetHotkey = 'h'
      hotkeysProvider.cheatSheetDescription = 'Alternate description'
      return

    inject ($rootElement, hotkeys) ->
      expect(hotkeys.get('h')).not.toBe false
      expect(angular.element($rootElement).children().hasClass('in')).toBe false
      KeyEvent.simulate('?'.charCodeAt(0), 90)
      expect(angular.element($rootElement).children().hasClass('in')).toBe false
      KeyEvent.simulate('h'.charCodeAt(0), 90)
      expect(angular.element($rootElement).children().hasClass('in')).toBe true

      expect(hotkeys.get('h').description).toBe 'Alternate description'

  it 'should callback when hotkey is pressed in input when preventIn does not include INPUT', ->
    module 'cfp.hotkeys', (hotkeysProvider) ->
      hotkeysProvider.preventIn = ['SELECT', 'TEXTAREA']
      return

    inject ($rootElement, hotkeys) ->
      executed = no

      $body = angular.element document.body
      $input = angular.element '<input id="cfp-test"/>'
      $body.prepend $input

      hotkeys.add
        combo: 'w'
        callback: -> executed = yes

      KeyEvent.simulate('w'.charCodeAt(0), 90, undefined, $input[0])
      expect(executed).toBe yes
