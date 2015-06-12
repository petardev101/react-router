import React, { createElement, isValidElement } from 'react';
import warning from 'warning';
import invariant from 'invariant';
import { loopAsync } from './AsyncUtils';
import { createRoutes } from './RouteUtils';
import { pathnameIsActive, queryIsActive } from './ActiveUtils';
import { getState, getTransitionHooks, getComponents, createTransitionHook, getRouteParams, runTransition } from './RoutingUtils';
import { routes, component, components, history, location } from './PropTypes';
import Location from './Location';

var { arrayOf, func, object } = React.PropTypes;

var ServerTransitionDelegate = {
  getState,
  getTransitionHooks,
  getComponents
};

var RoutingContextMixin = {

  childContextTypes: {
    router: object.isRequired
  },

  getChildContext() {
    return {
      router: this
    };
  },

  makePath(pathname, query) {
    return this.props.history.makePath(pathname, query);
  },

  makeHref(pathname, query) {
    return this.props.history.makeHref(pathname, query);
  },

  transitionTo(pathname, query, state=null) {
    var { history } = this.props;
    var path = this.makePath(pathname, query);

    if (this.nextLocation) {
      history.replaceState(state, path);
    } else {
      history.pushState(state, path);
    }
  },

  replaceWith(pathname, query, state=null) {
    var { history } = this.props;
    var path = this.makePath(pathname, query);

    history.replaceState(state, path);
  },

  go(n) {
    this.props.history.go(n);
  },

  goBack() {
    this.go(-1);
  },

  goForward() {
    this.go(1);
  },
 
  isActive(pathname, query) {
    var { location } = this.state;

    if (location == null)
      return false;

    return pathnameIsActive(pathname, location.pathname) &&
      queryIsActive(query, location.query);
  }

};

var TransitionDelegateMixin = {

  /**
   * Adds a transition hook that runs before all route hooks in a
   * transition. The signature is the same as route transition hooks.
   */
  addTransitionHook(hook) {
    if (!this.transitionHooks)
      this.transitionHooks = [];

    this.transitionHooks.push(hook);
  },

  /**
   * Removes the given transition hook.
   */
  removeTransitionHook(hook) {
    if (this.transitionHooks)
      this.transitionHooks = this.transitionHooks.filter(h => h !== hook);
  },

  getState(routes, location, callback) {
    var { branch, params } = this.props;
  
    if (branch && params) {
      callback(null, { branch, params });
    } else {
      getState(routes, location, callback);
    }
  },
  
  getTransitionHooks(prevState, nextState) {
    var hooks = [];

    // Run component hooks before route hooks.
    if (this.transitionHooks)
      hooks.push.apply(hooks, this.transitionHooks.map(hook => createTransitionHook(hook, this)));
  
    hooks.push.apply(hooks, getTransitionHooks(prevState, nextState));

    return hooks;
  },
  
  getComponents(nextState, callback) {
    var { components } = this.props;

    if (components) {
      callback(null, components);
    } else {
      getComponents(nextState, callback);
    }
  }
  
};

export var Router = React.createClass({

  mixins: [ RoutingContextMixin, TransitionDelegateMixin ],

  statics: {
    
    match(routes, location, callback) {
      runTransition(null, routes, location, ServerTransitionDelegate, callback);
    }

  },

  propTypes: {
    createElement: func.isRequired,
    onError: func.isRequired,
    onUpdate: func,

    // Client-side
    history,
    routes,
    // Routes may also be given as children (JSX)
    children: routes,

    // Server-side
    location,
    branch: routes,
    params: object,
    components: arrayOf(components)
  },

  getDefaultProps() {
    return {
      createElement,
      onError: function (error) {
        // Throw errors by default so we don't silently swallow them!
        throw error; // This error probably originated in getChildRoutes or getComponents.
      }
    };
  },

  getInitialState() {
    return {
      location: null,
      branch: null,
      params: null,
      components: null,
      isTransitioning: false
    };
  },

  _updateState(location) {
    invariant(
      Location.isLocation(location),
      'A <Router> needs a valid Location'
    );

    this.setState({ isTransitioning: true });

    runTransition(this.state, this.routes, location, this, (error, transition, state) => {
      this.setState({ isTransitioning: false });

      if (error) {
        this.handleError(error);
      } else if (transition.isCancelled) {
        if (transition.redirectInfo) {
          var { pathname, query, state } = transition.redirectInfo;
          this.replaceWith(pathname, query, state);
        } else {
          invariant(
            this.state.location,
            'You may not abort the initial transition'
          );

          // TODO: Do something with transition.abortReason ?

          // The best we can do here is goBack so the location state reverts
          // to what it was. However, we also set a flag so that we know not
          // to run through _updateState again since state did not change.
          this._ignoreNextHistoryChange = true;
          this.goBack();
        }
      } else if (state == null) {
        warning(false, 'Location "%s" did not match any routes', location.pathname);
      } else {
        this.setState(state, this.props.onUpdate);
        this._alreadyUpdated = true;
      }
    });
  },

  _createElement(component, props) {
    return typeof component === 'function' ? this.props.createElement(component, props) : null;
  },

  handleHistoryChange() {
    if (this._ignoreNextHistoryChange) {
      this._ignoreNextHistoryChange = false;
    } else {
      this._updateState(this.props.history.location);
    }
  },

  componentWillMount() {
    var { history, routes, children } = this.props;

    if (history) {
      invariant(
        routes || children,
        'A client-side <Router> needs some routes. Try using <Router routes> or ' +
        'passing your routes as nested <Route> children'
      );

      this.routes = createRoutes(routes || children);

      if (typeof history.setup === 'function')
        history.setup();

      // We need to listen first in case we redirect immediately.
      if (history.addChangeListener)
        history.addChangeListener(this.handleHistoryChange);

      this._updateState(history.location);
    } else {
      var { location, branch, params, components } = this.props;

      invariant(
        location && branch && params && components,
        'A server-side <Router> needs location, branch, params, and components ' +
        'props. Try using Router.match to get all the props you need'
      );

      this.setState({ location, branch, params, components });
    }
  },

  componentDidMount() {
    // React doesn't fire the setState callback when we call setState
    // synchronously within componentWillMount, so we need this. Note
    // that we still only get one call to onUpdate, even if setState
    // was called multiple times in componentWillMount.
    if (this._alreadyUpdated && this.props.onUpdate)
      this.props.onUpdate.call(this);
  },

  componentWillReceiveProps(nextProps) {
    invariant(
      this.props.history === nextProps.history,
      '<Router history> may not be changed'
    );

    if (nextProps.history) {
      var currentRoutes = this.props.routes || this.props.children;
      var nextRoutes = nextProps.routes || nextProps.children;

      if (currentRoutes !== nextRoutes) {
        this.routes = createRoutes(nextRoutes);

        // Call this here because _updateState
        // uses this.routes to determine state.
        if (nextProps.history.location)
          this._updateState(nextProps.history.location);
      }
    }
  },

  componentWillUnmount() {
    var { history } = this.props;

    if (history && history.removeChangeListener)
      history.removeChangeListener(this.handleHistoryChange);
  },

  render() {
    var { location, branch, params, components, isTransitioning } = this.state;
    var element = null;

    if (components) {
      element = components.reduceRight((element, components, index) => {
        if (components == null)
          return element; // Don't create new children; use the grandchildren.

        var route = branch[index];
        var routeParams = getRouteParams(route, params);
        var props = { location, params, route, routeParams, isTransitioning };

        if (isValidElement(element)) {
          props.children = element;
        } else if (element) {
          // In render, do var { header, sidebar } = this.props;
          Object.assign(props, element);
        }

        if (typeof components === 'object') {
          var elements = {};

          for (var key in components)
            if (components.hasOwnProperty(key))
              elements[key] = this._createElement(components[key], props);

          return elements;
        }

        return this._createElement(components, props);
      }, element);
    }

    invariant(
      element === null || element === false || isValidElement(element),
      'The root route must render a single element'
    );

    return element;
  }

});

export default Router;
