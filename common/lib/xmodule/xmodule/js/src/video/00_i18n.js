(function (define) {
'use strict';
define(
'video/00_i18n.js',
[],
function() {
    /**
     * i18n module.
     * @exports video/00_i18n.js
     * @return {object}
     */

    return {
        // Translators: "points" is the student's achieved score, and "total_points" is the maximum number of points achievable.
        '(%(points)s / %(total_points)s points)': gettext('(%(points)s / %(total_points)s points)'),
        'You\'ve received credit for viewing this video.': gettext('You\'ve received credit for viewing this video.'),
        GRADER_ERROR: gettext('An error occurred. Please refresh the page and try viewing the video again.')
    };
});
}(RequireJS.define));

