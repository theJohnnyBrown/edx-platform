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
            return new GraderCollection(state);
        }

        var self,
            conversions = {
                'scored_on_end': 'GradeOnEnd',
                'scored_on_percent': 'GradeOnPercent'
            };

        if (!state.config.hasScore) {
            return [];
        } else {
            return $.map(function (config, name) {
                var graderName = self.conversions[name],
                    grader = GraderCollection[graderName];

                if (grader) {
                    return new grader(element, state, config);
                }
            });
        }
    };

    // Write graders below this line
    GraderCollection.GradeOnEnd = AbstractGrader.extend({
        getGrader: function (element, state, config) {
            var dfd = $.Deferred();

            element.on('ended', dfd.resolve);

            return dfd.promise();
        },

        backendPropertyName: 'scored_on_end'
    });

    GraderCollection.GradeOnPercent = AbstractGrader.extend({
        getGrader: function (element, state, config) {
            var dfd = $.Deferred(),
                self = this;

            // TODO: Implement success scenario.
            // element.on('ended', dfd.resolve);
            element.on('update', function (event, currentTime) {
                if (currentTime > 10 && self.graderConfig[0] === false) {
                    debugger;
                    console.log('self = ', self);
                    self.graderConfig[0] = true;

                    dfd.resolve();
                }
            });

            return dfd.promise();
        },

        backendPropertyName: 'scored_on_percent'
    });

    return GraderCollection;
});

}(window.RequireJS.define));
