(function() {
  var $;
  var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; }
    function ctor() { this.constructor = child; }
    ctor.prototype = parent.prototype;
    child.prototype = new ctor;
    child.__super__ = parent.prototype;
    return child;
  };
  $ = jQuery;
  Date.prototype.setISO8601 = function(string) {
    var d, date, offset, regexp, time, _ref;
    regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" + "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" + "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    d = string.match(new RegExp(regexp));
    offset = 0;
    date = new Date(d[1], 0, 1);
    if (d[3]) {
      date.setMonth(d[3] - 1);
    }
    if (d[5]) {
      date.setDate(d[5]);
    }
    if (d[7]) {
      date.setHours(d[7]);
    }
    if (d[8]) {
      date.setMinutes(d[8]);
    }
    if (d[10]) {
      date.setSeconds(d[10]);
    }
    if (d[12]) {
      date.setMilliseconds(Number("0." + d[12]) * 1000);
    }
    if (d[14]) {
      offset = (Number(d[16]) * 60) + Number(d[17]);
      offset *= (_ref = d[15] === '-') != null ? _ref : {
        1: -1
      };
    }
    offset -= date.getTimezoneOffset();
    time = Number(date) + (offset * 60 * 1000);
    this.setTime(Number(time));
    return this;
  };
  Annotator.Plugins.Auth = (function() {
    __extends(Auth, Delegator);
    Auth.prototype.options = {
      token: null,
      tokenUrl: '/auth/token',
      autoFetch: true
    };
    function Auth(element, options) {
      this.haveValidToken = __bind(this.haveValidToken, this);;      Auth.__super__.constructor.apply(this, arguments);
      this.addEvents();
      $(this.element).data('annotator:auth', this);
      this.waitingForToken = [];
      if (this.options.token) {
        this.setToken(this.options.token);
      } else {
        this.requestToken();
      }
    }
    Auth.prototype.requestToken = function() {
      this.requestInProgress = true;
      return $.getJSON(this.options.tokenUrl, __bind(function(data, status, xhr) {
        if (status !== 'success') {
          return console.error("Couldn't get auth token: " + status, xhr);
        } else {
          this.setToken(data);
          return this.requestInProgress = false;
        }
      }, this));
    };
    Auth.prototype.setToken = function(token) {
      var _results;
      this.token = token;
      if (this.haveValidToken()) {
        if (this.options.autoFetch) {
          this.refreshTimeout = setTimeout((__bind(function() {
            return this.requestToken();
          }, this)), (this.timeToExpiry() - 2) * 1000);
        }
        this.updateHeaders();
        _results = [];
        while (this.waitingForToken.length > 0) {
          _results.push(this.waitingForToken.pop().apply());
        }
        return _results;
      } else {
        console.warn("Didn't get a valid token.");
        if (this.options.autoFetch) {
          console.warn("Getting a new token in 10s.");
          return setTimeout((__bind(function() {
            return this.requestToken();
          }, this)), 10 * 1000);
        }
      }
    };
    Auth.prototype.haveValidToken = function() {
      var allFields;
      allFields = this.token && this.token.authToken && this.token.authTokenIssueTime && this.token.authTokenTTL && this.token.consumerKey && this.token.userId;
      return allFields && this.timeToExpiry() > 0;
    };
    Auth.prototype.timeToExpiry = function() {
      var expiry, issue, now, timeToExpiry;
      now = new Date().getTime() / 1000;
      issue = new Date().setISO8601(this.token.authTokenIssueTime).getTime() / 1000;
      expiry = issue + this.token.authTokenTTL;
      timeToExpiry = expiry - now;
      if (timeToExpiry > 0) {
        return timeToExpiry;
      } else {
        return 0;
      }
    };
    Auth.prototype.updateHeaders = function() {
      var current;
      current = $(this.element).data('annotator:headers');
      return $(this.element).data('annotator:headers', $.extend(current, {
        'x-annotator-auth-token': this.token.authToken,
        'x-annotator-auth-token-issue-time': this.token.authTokenIssueTime,
        'x-annotator-auth-token-ttl': this.token.authTokenTTL,
        'x-annotator-consumer-key': this.token.consumerKey,
        'x-annotator-user-id': this.token.userId
      }));
    };
    Auth.prototype.withToken = function(callback) {
      if (!(callback != null)) {
        return;
      }
      if (this.haveValidToken()) {
        return callback();
      } else {
        this.waitingForToken.push(callback);
        if (!this.requestInProgress) {
          return this.requestToken();
        }
      }
    };
    return Auth;
  })();
}).call(this);
