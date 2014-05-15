/**
 * @file HTML5 video player module. Provides methods to control the in-browser
 * HTML5 video player.
 *
 * The goal was to write this module so that it closely resembles the YouTube
 * API. The main reason for this is because initially the edX video player
 * supported only YouTube videos. When HTML5 support was added, for greater
 * compatibility, and to reduce the amount of code that needed to be modified,
 * it was decided to write a similar API as the one provided by YouTube.
 *
 * @external RequireJS
 *
 * @module HTML5Video
 */

(function (requirejs, require, define) {

define(
'video/02_html5_video.js',
[],
function () {
    var HTML5Video = {};

    HTML5Video.Player = (function () {
        Player.prototype.callStateChangeCallback = function () {
            if ($.isFunction(this.config.events.onStateChange)) {
                this.config.events.onStateChange({
                    data: this.playerState
                });
            }
        };

        Player.prototype.pauseVideo = function () {
            this.video.pause();
        };

        Player.prototype.seekTo = function (value) {
            if (
                typeof value === 'number' &&
                value <= this.video.duration &&
                value >= 0
            ) {
                this.video.currentTime = value;
            }
        };

        Player.prototype.setVolume = function (value) {
            if (typeof value === 'number' && value <= 100 && value >= 0) {
                this.video.volume = value * 0.01;
            }
        };

        Player.prototype.getCurrentTime = function () {
            return this.video.currentTime;
        };

        Player.prototype.playVideo = function () {
            this.video.play();
        };

        Player.prototype.getPlayerState = function () {
            return this.playerState;
        };

        Player.prototype.getVolume = function () {
            return this.video.volume;
        };

        Player.prototype.getDuration = function () {
            if (isNaN(this.video.duration)) {
                return 0;
            }

            return this.video.duration;
        };

        Player.prototype.setPlaybackRate = function (value) {
            var newSpeed;

            newSpeed = parseFloat(value);

            if (isFinite(newSpeed)) {
                if (this.video.playbackRate !== value) {
                    this.video.playbackRate = value;
                }
            }
        };

        Player.prototype.getAvailablePlaybackRates = function () {
            return [0.75, 1.0, 1.25, 1.5];
        };

        Player.prototype._getLogs = function () {
            return this.logs;
        };

        return Player;

        /*
         * Constructor function for HTML5 Video player.
         *
         * @param {String|Object} el A DOM element where the HTML5 player will
         * be inserted (as returned by jQuery(selector) function), or a
         * selector string which will be used to select an element. This is a
         * required parameter.
         *
         * @param config - An object whose properties will be used as
         * configuration options for the HTML5 video player. This is an
         * optional parameter. In the case if this parameter is missing, or
         * some of the config object's properties are missing, defaults will be
         * used. The available options (and their defaults) are as
         * follows:
         *
         *     config = {
         *
         *        videoSources: {},   // An object with properties being video
         *                            // sources. The property name is the
         *                            // video format of the source. Supported
         *                            // video formats are: 'mp4', 'webm', and
         *                            // 'ogg'.
         *
         *          events: {         // Object's properties identify the
         *                            // events that the API fires, and the
         *                            // functions (event listeners) that the
         *                            // API will call when those events occur.
         *                            // If value is null, or property is not
         *                            // specified, then no callback will be
         *                            // called for that event.
         *
         *              onReady: null,
         *              onStateChange: null
         *          }
         *     }
         */
        function Player(el, config) {
            var isTouch = onTouchBasedDevice() || '',
                sourceStr, _this, errorMessage;

            this.logs = [];
            // Initially we assume that el is a DOM element. If jQuery selector
            // fails to select something, we assume that el is an ID of a DOM
            // element. We try to select by ID. If jQuery fails this time, we
            // return. Nothing breaks because the player 'onReady' event will
            // never be fired.

            this.el = $(el);
            if (this.el.length === 0) {
                this.el = $('#' + el);

                if (this.el.length === 0) {
                    errorMessage = 'VideoPlayer: Element corresponding to ' +
                        'the given selector does not found.';
                    if (window.console && console.log) {
                        console.log(errorMessage);
                    } else {
                        throw new Error(errorMessage);
                    }
                    return;
                }
            }

            // A simple test to see that the 'config' is a normal object.
            if ($.isPlainObject(config)) {
                this.config = config;
            } else {
                return;
            }

            // We should have at least one video source. Otherwise there is no
            // point to continue.
            if (!config.videoSources) {
                return;
            }

            // From the start, all sources are empty. We will populate this
            // object below.
            sourceStr = {
                mp4: ' ',
                webm: ' ',
                ogg: ' '
            };

            // Will be used in inner functions to point to the current object.
            _this = this;

            // Create HTML markup for individual sources of the HTML5 <video>
            // element.
            $.each(sourceStr, function (videoType, videoSource) {
                var url = _this.config.videoSources[videoType];
                if (url && url.length) {
                    sourceStr[videoType] =
                        '<source ' +
                            'src="' + url +
                            // Following hack allows to open the same video twice
                            // https://code.google.com/p/chromium/issues/detail?id=31014
                            // Check whether the url already has a '?' inside, and if so,
                            // use '&' instead of '?' to prevent breaking the url's integrity.
                            (url.indexOf('?') == -1 ? '?' : '&') + (new Date()).getTime() +
                            '" ' + 'type="video/' + videoType + '" ' +
                        '/> ';
                }
            });

            // We should have at least one video source. Otherwise there is no
            // point to continue.
            if (
                sourceStr.mp4 === ' ' &&
                sourceStr.webm === ' ' &&
                sourceStr.ogg === ' '
            ) {
                return;
            }

            // Create HTML markup for the <video> element, populating it with
            // sources from previous step. Because of problems with creating
            // video element via jquery (http://bugs.jquery.com/ticket/9174) we
            // create it using native JS.
            this.video = document.createElement('video');
            errorMessage = gettext('This browser cannot play .mp4, .ogg, or ' +
                '.webm files. Try using a different browser, such as Google ' +
                'Chrome.');
            this.video.innerHTML = _.values(sourceStr).join('') + errorMessage;

            // Get the jQuery object, and set the player state to UNSTARTED.
            // The player state is used by other parts of the VideoPlayer to
            // determine what the video is currently doing.
            this.videoEl = $(this.video);

            if (/iP(hone|od)/i.test(isTouch[0])) {
                this.videoEl.prop('controls', true);
            }

            this.playerState = HTML5Video.PlayerState.UNSTARTED;

            // Attach a 'click' event on the <video> element. It will cause the
            // video to pause/play.
            this.videoEl.on('click', function (event) {
                var PlayerState = HTML5Video.PlayerState;

                if (_this.playerState === PlayerState.PLAYING) {
                    _this.pauseVideo();
                    _this.playerState = PlayerState.PAUSED;
                    _this.callStateChangeCallback();
                } else {
                    _this.playVideo();
                    _this.playerState = PlayerState.PLAYING;
                    _this.callStateChangeCallback();
                }
            });

            var events = ['loadstart', 'progress', 'suspend', 'abort', 'error',
                'emptied', 'stalled', 'play', 'pause', 'loadedmetadata',
                'loadeddata', 'waiting', 'playing', 'canplay', 'canplaythrough',
                'seeking', 'seeked', 'timeupdate', 'ended', 'ratechange',
                'durationchange', 'volumechange'
            ];

            $.each(events, function(index, eventName) {
                _this.video.addEventListener(eventName, function () {
                    _this.logs.push({
                        'event name': eventName,
                        'state': _this.playerState
                    });

                    el.trigger('html5:' + eventName, arguments);
                });
            });

            // When the <video> tag has been processed by the browser, and it
            // is ready for playback, notify other parts of the VideoPlayer,
            // and initially pause the video.
            this.video.addEventListener('loadedmetadata', function () {
                _this.playerState = HTML5Video.PlayerState.PAUSED;
                if ($.isFunction(_this.config.events.onReady)) {
                    _this.config.events.onReady(null);
                }
            }, false);

            // Register the 'play' event.
            this.video.addEventListener('play', function () {
                _this.playerState = HTML5Video.PlayerState.BUFFERING;
                _this.callStateChangeCallback();
            }, false);

            this.video.addEventListener('playing', function () {
                _this.playerState = HTML5Video.PlayerState.PLAYING;
                _this.callStateChangeCallback();
            }, false);

            // Register the 'pause' event.
            this.video.addEventListener('pause', function () {
                _this.playerState = HTML5Video.PlayerState.PAUSED;
                _this.callStateChangeCallback();
            }, false);

            // Register the 'ended' event.
            this.video.addEventListener('ended', function () {
                _this.playerState = HTML5Video.PlayerState.ENDED;
                _this.callStateChangeCallback();
            }, false);

            // Place the <video> element on the page.
            this.videoEl.appendTo(this.el.find('.video-player div'));
        }
    }());

    // The YouTube API presents several constants which describe the player's
    // state at a given moment. HTML5Video API will copy these constants so
    // that code which uses both the YouTube API and this API doesn't have to
    // change.
    HTML5Video.PlayerState = {
        UNSTARTED: -1,
        ENDED: 0,
        PLAYING: 1,
        PAUSED: 2,
        BUFFERING: 3,
        CUED: 5
    };

    // HTML5Video object - what this module exports.
    return HTML5Video;
});

}(RequireJS.requirejs, RequireJS.require, RequireJS.define));
