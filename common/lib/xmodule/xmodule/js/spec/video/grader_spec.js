(function (require) {
'use strict';
require(
['video/11_grader.js', 'video/00_i18n.js'],
function (Grader, i18n) {
describe('VideoGrader', function () {
    var SCORED_TEXT = '(0.5 / 1.0 points)',
        POSSIBLE_SCORES = '1.0 points possible',
        SUCCESS_MESSAGE = 'You\'ve received credit for viewing this video.',
        ERROR_MESSAGE = [
            'An error occurred. ',
            'Please refresh the page and try viewing the video again.'
        ].join(''),
        state, grader;

    beforeEach(function () {
        loadFixtures('video.html');
        state = {
            el: $('.video'),
            progressElement: $('.problem-progress'),
            statusElement: $('.problem-feedback'),
            videoPlayer: {
                duration: jasmine.createSpy().andReturn(100)
            },
            storage: {
                setItem: jasmine.createSpy()
            },
            config: {
                hasScore: true,
                maxScore: '1.0',
                score: null,
                gradeUrl: '/grade_url',
                graders: {
                    scored_on_end: {graderStatus: false, graderValue: true},
                    scored_on_percent: {graderStatus: false, graderValue: 2}
                }
            }
        };
    });

    describe('initialize', function () {
        it('Score is shown if module is graded.', function () {
            state.config.score = '0.5';
            new Grader(state, i18n);
            expect(state.progressElement.text()).toBe(SCORED_TEXT);
        });

        it('Score is hidden if module does not graded.', function () {
            new Grader(state, i18n);
            expect(state.progressElement.text()).toBe(POSSIBLE_SCORES);
        });

        it('Score is hidden if incorrect score was retrieved.', function () {
            state.config.score = 'a0.5a';
            new Grader(state, i18n);
            expect(state.progressElement.text()).toBe(POSSIBLE_SCORES);
        });
    });

    describe('getGraders', function () {
        it('returns collection with graders', function () {
            var getGraders = Grader.prototype.getGraders;

            new Grader(state, i18n);
            expect(getGraders(state.el, state).length).toBe(2);
        });
    });

    describe('Status bar', function () {
        beforeEach(function () {
            state.config.graders.scored_on_percent.graderStatus = true;
        });

        it('shows success message', function () {
            new Grader(state, i18n);

            expect(state.progressElement.text()).toBe(POSSIBLE_SCORES);
            expect($('.problem-feedback').length).toBe(0);

            jasmine.stubRequests();
            state.el.trigger('ended');

            expect(state.progressElement.text()).toBe(SCORED_TEXT);
            expect($('.problem-feedback').text()).toBe(SUCCESS_MESSAGE);
            expect(state.storage.setItem).toHaveBeenCalledWith(
                'score', '0.5', true
            );
        });

        it('shows error message', function () {
            runs(function () {
                new Grader(state, i18n);

                expect(state.progressElement.text()).toBe(POSSIBLE_SCORES);
                expect($('.problem-feedback').length).toBe(0);

                state.el.trigger('ended');
            });

            waitsFor(function () {
                return $('.problem-feedback').length;
            }, 'Respond from server does not received.', WAIT_TIMEOUT);

            runs(function () {
                expect(state.progressElement.text()).toBe(POSSIBLE_SCORES);
                expect($('.problem-feedback').text()).toBe(ERROR_MESSAGE);
                expect(state.storage.setItem).not.toHaveBeenCalled();
            });
        });
    });

    describe('GradeOnEnd', function () {
        beforeEach(function () {
            state.config.graders.scored_on_percent.graderStatus = true;
            jasmine.stubRequests();
            new Grader(state, i18n);
            state.el.trigger('ended');
        });

        it('updates status message when done', function () {
            expect($('.problem-feedback').text()).toBe(SUCCESS_MESSAGE);
        });

        it('updates just once', function () {
            state.el.trigger('ended');
            state.el.trigger('ended');
            expect(state.storage.setItem.calls.length).toBe(1);
        });
    });

    describe('GradeOnPercent', function () {
        beforeEach(function () {
            state.config.graders.scored_on_end.graderStatus = true;
            jasmine.stubRequests();
            spyOn(_, 'throttle').andCallFake(function(f){ return f; }) ;
        });

        it('shows success message', function () {
            new Grader(state, i18n);
            state.el.trigger('play');
            expect($('.problem-feedback').length).toBe(0);
            state.el.trigger('progress', [0.9]);
            expect($('.problem-feedback').length).toBe(0);
            state.el.trigger('progress', [1.1]);
            expect($('.problem-feedback').length).toBe(0);
            state.el.trigger('progress', [1.5]);
            expect($('.problem-feedback').length).toBe(0);
            state.el.trigger('progress', [2.1]);
            expect($('.problem-feedback').text()).toBe(SUCCESS_MESSAGE);
        });

        it('shows success message if percent equal 100', function () {
            state.videoPlayer.duration.andReturn(100);
            state.config.graders.scored_on_percent.graderValue = 100;
            new Grader(state, i18n);
            state.el.trigger('play');

            for (var i = 0, k = 0; i <= 100; i++, k += 1) {
                state.el.trigger('progress', [k]);
            }

            expect($('.problem-feedback').text()).toBe(SUCCESS_MESSAGE);
        });

        it('shows success message immediately if percent equal 0', function () {
            state.videoPlayer.duration.andReturn(100);
            state.config.graders.scored_on_percent.graderValue = 0;
            new Grader(state, i18n);
            expect($('.problem-feedback').text()).toBe(SUCCESS_MESSAGE);
        });

        it('shows success message if duration is less than 20s', function () {
            state.videoPlayer.duration.andReturn(1);
            state.config.graders.scored_on_percent.graderValue = 50;
            new Grader(state, i18n);
            state.el.trigger('play');

            for (var i = 0, k = 0; i <= 5; i++, k += 0.2) {
                state.el.trigger('progress', [k]);
            }

            expect($('.problem-feedback').text()).toBe(SUCCESS_MESSAGE);
        });
    });
});
});
}(RequireJS.require));
