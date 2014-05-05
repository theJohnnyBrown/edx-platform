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
     * @param {object} state The object containing the state of the video
     * player.
     * @return {jquery Promise}
     */
    var GraderCollection = function (element, state) {
        if (!(this instanceof GraderCollection)) {
            return new GraderCollection(element, state);
        }

        var self,
            hasScore = state.config.hasScore,
            graders = state.config.graders,
            conversions = {
                'scored_on_end': 'GradeOnEnd',
                'scored_on_percent': 'GradeOnPercent'
            };

        var mapping = function (config, name) {
            var graderName = conversions[name],
                grader = GraderCollection[graderName];

            if (grader && !config[0]) {
                return new grader(element, state, config);
            }
        };

        return (hasScore) ? $.map(graders, mapping) : [];
    };

    // Write graders below this line
    GraderCollection.GradeOnEnd = AbstractGrader.extend({
        name: 'scored_on_end',

        getGrader: function (element, state, config) {
            var dfd = $.Deferred();

            element.on('ended', dfd.resolve);

            return dfd.promise();
        }
    });

    GraderCollection.GradeOnPercent = AbstractGrader.extend({
        name: 'scored_on_percent',

        getGrader: function (element, state, config) {
            var dfd = $.Deferred();

            // TODO: Implement success scenario.
            // element.on('ended', dfd.resolve);
            element.on('update', function (event, currentTime) {
                if (currentTime > config[1] && !config[0]) {
                    config[0] = true;
                    dfd.resolve();
                }
            });

            return dfd.promise();
        }
    });

    return GraderCollection;
});

}(window.RequireJS.define));
