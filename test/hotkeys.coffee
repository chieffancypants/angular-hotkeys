
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

  it 'del()', ->
    hotkeys.add 'w', ->
    expect(hotkeys.get('w').description).toBe '$$undefined$$'
    hotkeys.del 'w'
    expect(hotkeys.get('w')).toBe false

  it 'should toggle help whem ? is pressed', ->
    KeyEvent.simulate('?'.charCodeAt(0), 90)
    el = document.getElementsByTagName('cfp-hotkeys-container')
    dump el.length

  it 'should (un)bind based on route changes', ->
    # fake a route change:
    expect(hotkeys.get('w e s')).toBe false
    $rootScope.$broadcast('$routeChangeSuccess', { hotkeys: [['w e s', 'Do something Amazing!', 'consoleme("playa")']] });
    expect(hotkeys.get('w e s').combo).toBe 'w e s'

    # ensure hotkey is unbound when the route changes
    $rootScope.$broadcast('$routeChangeSuccess', {});
    expect(hotkeys.get('w e s')).toBe false

describe 'Platform specific things', ->
  beforeEach ->
    windowMock =
      navigator:
        platform: 'Macintosh'

    module 'cfp.hotkeys'

  it 'should display mac key combos', ->
    module ($provide) ->
      $provide.value '$window',
        navigator:
          platform: 'Macintosh'
      return

    inject (hotkeys) ->
      hotkeys.add 'mod+e', 'description'
      expect(hotkeys.get('mod+e').format()[0]).toBe '⌘ + e'

  it 'should display win/linux key combos', ->
    module ($provide) ->
      $provide.value '$window',
        navigator:
          platform: 'Linux x86_64'
      return

    inject (hotkeys) ->
      hotkeys.add 'mod+e', 'description'
      expect(hotkeys.get('mod+e').format()[0]).toBe 'ctrl + e'
