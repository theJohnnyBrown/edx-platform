(function (define) {
'use strict';
define(
'video/10_grader_collection.js',
['video/00_abstract_grader.js'],
function (AbstractGrader) {
    /**
     * GraderCollection module.
     * @exports video/10_grader_collection.js
     * @constructor
     * @param {Object} state The object containing the state of the video
     * player.
     * @return {jquery Promise}
     */
    var GraderCollection = function (element, state) {
        if (!(this instanceof GraderCollection)) {
            return new GraderCollection(element, state);
        }

        var hasScore = state.config.hasScore,
            graders = state.config.graders,
            conversions = {
                'scored_on_end': 'GradeOnEnd',
                'scored_on_percent': 'GradeOnPercent'
            };

        return (!hasScore) ? [] : $.map(graders, function (config, name) {
            var graderName = conversions[name],
                Grader = GraderCollection[graderName];

            if (Grader && !config.graderStatus) {
                return new Grader(element, state, config);
            }
        });
    };

    /** Write graders below this line **/

    GraderCollection.GradeOnEnd = AbstractGrader.extend({
        name: 'scored_on_end',

        getGrader: function (element) {
            var dfd = $.Deferred();

            element.on('ended', dfd.resolve);

            return dfd.promise();
        }
    });

    GraderCollection.GradeOnPercent = AbstractGrader.extend({
        name: 'scored_on_percent',
        size: 100,

        getGrader: function (element, state, config) {
            this.dfd = $.Deferred();
            this.element = element;
            this.timeline = this.createTimeline(this.size);
            this.element.on('play', _.once(this.onPlayHandler.bind(this)));

            return this.dfd.promise();
        },

        createTimeline: function (size) {
            return new Array(size);
        },

        getProgress: function (timeline) {
            return _.compact(timeline).length;
        },

        onPlayHandler: function (event) {
            var duration = state.videoPlayer.duration(),
                waitTime = 1000 * duration/this.size;

            this.element.on(
                'progress',
                _.throttle(this.onProgressHandler.bind(this), waitTime)
            );
        },

        onProgressHandler: function (event, currentTime) {
            var position = Math.floor(100 * currentTime/duration);

            this.timeline[position] = true;
            if (this.getProgress(timeline) >= this.config.graderValue) {
                this.dfd.resolve();
            }
        }
    });

    return GraderCollection;
});

}(window.RequireJS.define));
