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
     * @param {object} state The object containing the state of the video
     * player.
     * @return {jquery Promise}
     */
    var AbstractGrader = function () { };

    AbstractGrader.extend = function (protoProps) {
        var Parent = this,
            Child = function () {
                if ($.isFunction(this['initialize'])) {
                    return this['initialize'].apply(this, arguments);
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
        /** Initializes the module. */
        initialize: function (state, i18n) {
            this.state = state;
            this.el = this.state.el;
            this.url = this.state.config.gradeUrl;
            this.grader = this.getGrader(this.el, this.state);

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
        getGrader: function (element, state) {
            throw new Error('Please implement logic of the `getGrader` method.');
        },

        /**
         * Sends results of grading to the server.
         * @return {jquery Promise}
         */
        sendGrade: function (grader) {
            return $.ajaxWithPrefix({
                url: this.url,
                type: 'POST',
                notifyOnError: false
            });
        },

        /**
         * Decorates provided grader to send grade results on success.
         * @param {jquery Promise} grader Grader function.
         */
        sendGradeOnSuccess: function (grader) {
            var grade = grader.pipe(function () {
                    return this.sendGrade();
                });

            return grade
                .done(dfd.resolve)
                .fail(dfd.reject);
        }
    };

    return AbstractGrader;
});
}(RequireJS.define));
