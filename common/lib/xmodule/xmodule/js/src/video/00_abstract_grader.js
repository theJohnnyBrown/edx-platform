(function (define) {
'use strict';
define(
'video/00_abstract_grader.js',
[],
function() {
    /**
     * AbstractGrader module.
     * @exports video/00_abstract_grader.js
     * @constructor
     * @param {Object} state The object containing the state of the video
     * player.
     * @return {jquery Promise}
     */
    var AbstractGrader = function () { };

    /**
     * Returns new constructor that inherits form the current constructor.
     * @static
     * @param {Object} protoProps The object containing which will be added to
     * the prototype.
     * @return {Object}
     */
    AbstractGrader.extend = function (protoProps) {
        var Parent = this,
            Child = function () {
                if ($.isFunction(this.initialize)) {
                    return this.initialize.apply(this, arguments);
                }
            };

        // inherit
        var F = function () {};
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.constructor = Parent;
        Child.__super__ = Parent.prototype;

        if (protoProps) {
            $.extend(Child.prototype, protoProps);
        }

        return Child;
    };

    AbstractGrader.prototype = {
        /** Grader name on backend */
        name: '',

        /** Initializes the module. */
        initialize: function (element, state, config) {
            this.el = element;
            this.state = state;
            this.config = config;
            this.url = this.state.config.gradeUrl;
            this.grader = this.getGrader(this.el, this.state, this.config);

            return this.sendGradeOnSuccess(this.grader);
        },

        /**
         * Factory method that returns instance of needed Grader.
         * @return {jquery Promise}
         * @example:
         *   var dfd = $.Deferred();
         *   this.el.on('play', dfd.resolve);
         *   return dfd.promise();
         */
        getGrader: function (element, state, config) {
            throw new Error('Please implement logic of the `getGrader` method.');
        },

        /**
         * Sends results of grading to the server.
         * @return {jquery Promise}
         */
        sendGrade: function () {
            return $.ajaxWithPrefix({
                url: this.url,
                data: {
                    'graderName': this.name
                },
                type: 'POST',
                notifyOnError: false
            });
        },

        /**
         * Decorates provided grader to send grade results on succeeded scoring.
         * @param {jquery Promise} grader Grader function.
         */
        sendGradeOnSuccess: function (grader) {
            return grader.pipe(this.sendGrade.bind(this));
        }
    };

    return AbstractGrader;
});
}(RequireJS.define));
