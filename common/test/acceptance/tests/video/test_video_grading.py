# -*- coding: utf-8 -*-

"""
Acceptance tests for Video grading functionality.
"""

# @TODO
# 5) Verify error message and score is not stored (reload page and check progress message).

from ...pages.lms.progress import ProgressPage
from .test_video_module import VideoBaseTest


class VideoGradedTest(VideoBaseTest):
    """ Test Video Player """

    def setUp(self):
        super(VideoGradedTest, self).setUp()
        self.progress_page = ProgressPage(self.browser, self.course_id)

    def _assert_video_is_not_scored(self):
        self.assertEquals(self.video.progress_message_text(), '(1.0 points possible)')
        self.assertFalse(self.video.is_status_message_shown())

    def _assert_video_is_scored_successfully(self):
        self.assertEquals(self.video.progress_message_text(), '(1.0 / 1.0 points)')
        self.assertEquals(self.video.status_message_text(), 'You\'ve received credit for viewing this video.')

    def _assert_video_is_graded_successfully(self):
        self.tab_nav.go_to_tab('Progress')
        actual_scores = self.progress_page.scores('Test Chapter', 'Test Section')
        self.assertEqual(actual_scores, [(1, 1)])

    def _assert_error_score_message_is_shown(self):
        pass

class YouTubeVideoGradedTest(VideoGradedTest):
    """ Test YouTube Video Player """

    def setUp(self):
        super(YouTubeVideoGradedTest, self).setUp()

    def test_video_is_scored_by_percent_to_view(self):
        """
        Scenario: Video Percent to View
        Given the course has a Video component in "Youtube" mode:
        |has_score|scored_on_percent|
        |True     |1%               |
        And I see progress message is "1.0 points possible"
        And I do not see status message
        And I click video button "play"
        Then I see status and progress messages are visible
        And I see progress message is "(1.0 / 1.0 points)"
        And I see status message is "You've received credit for viewing this video."
        When I open progress page
        Then I see current scores are "1/1"
        """
        data = {'has_score': True, 'scored_on_percent': 1}
        self.metadata = self.metadata_for_mode('youtube', additional_data=data)
        self.navigate_to_video()
        self._assert_video_is_not_scored()
        self.video.click_player_button('play')
        self.video.wait_for_status_message()
        self._assert_video_is_scored_successfully()
        self._assert_video_is_graded_successfully()


class Html5VideoGradedTest(VideoGradedTest):
    """ Test Html5 Video Player """

    def setUp(self):
        super(Html5VideoGradedTest, self).setUp()

    def test_video_is_scored_by_on_end(self):
        """
        Scenario: Video component is scored by percent viewed
        Given the course has a Video component in "Html5" mode:
        |has_score|scored_on_end|
        |True     |True         |
        And I see progress message is "1.0 points possible"
        And I do not see status message
        And I click video button "play"
        Then I see status and progress messages are visible
        And I see progress message is "(1.0 / 1.0 points)"
        And I see status message is "You've received credit for viewing this video."
        When I open progress page
        Then I see current scores are "1/1"
        """
        data = {'has_score': True, 'scored_on_end': True}
        self.metadata = self.metadata_for_mode('html5', additional_data=data)
        self.navigate_to_video()
        self._assert_video_is_not_scored()
        self.video.click_player_button('play')

        # Play the video until the end.
        self.video.wait_for_state('finished');

        self._assert_video_is_scored_successfully()
        self._assert_video_is_graded_successfully()


    def test_video_is_scored_when_all_graders_are_enabled(self):
        """
        Scenario: Video component is scored by percent viewed
        Given the course has a Video component in "Html5" mode:
        |has_score|scored_on_end|scored_on_percent|
        |True     |True         |20%              |
        And I click video button "play"
        And the video is playing up to "0:02" seconds
        And I click video button "pause"
        And I see progress message is still "1.0 points possible"
        And I still do not see status message
        Then I reload the page
        And I click video button "play"
        And the video is playing up to the end
        Then I see status and progress messages are visible
        And I see progress message is "(1.0 / 1.0 points)"
        And I see status message is "You've received credit for viewing this video."
        When I open progress page
        Then I see current scores are "1/1"
        """
        data = {'has_score': True, 'scored_on_end': True, 'scored_on_percent': 40}
        self.metadata = self.metadata_for_mode('html5', additional_data=data)
        self.navigate_to_video()

        self.video.click_player_button('play')
        self.video.wait_for_position('0:03')
        # Video total time is 5 sec.
        # So 100 * 3/5 = 60% of video is played and it means that
        # `scored_on_percent` grader is passed. So, we pause the video and
        # verify that status and progress messages are still the same.
        self.video.click_player_button('pause')
        self._assert_video_is_not_scored()

        # Reloads the page and waits for content loading.
        self.browser.refresh()
        self.video.wait_for_page()

        self.video.click_player_button('play')

        # Play the video until the end.
        self.video.wait_for_state('finished');

        self._assert_video_is_scored_successfully()
        self._assert_video_is_graded_successfully()


    def test_video_score_messages_are_saved_between_seq_switch(self):
        """
        Same as test_video_is_scored_by_on_end,
        but after that navigate to other position of sequential and back,
        and same message should still appear.
        """
        data = {'has_score': True, 'scored_on_end': True}
        a_metadata = self.metadata_for_mode('html5', additional_data=data)
        b_metadata = self.metadata_for_mode('html5')

        self.verticals = [
            [{'display_name': 'A', 'metadata': a_metadata}],
            [{'display_name': 'B', 'metadata': b_metadata}],
        ]

        # open the section with videos (open video "A")
        self.navigate_to_video()
        self._assert_video_is_not_scored()
        self.video.click_player_button('play')

        # Play the video until the end.
        self.video.wait_for_state('finished');

        self._assert_video_is_scored_successfully()

        self.course_nav.go_to_sequential('B')
        self.course_nav.go_to_sequential('A')

        self._assert_video_is_scored_successfully()


    def test_error_message_and_score_is_not_stored(self):
        """

        """
        data = {'cumulative_score': 'just_string'}
        self.metadata = self.metadata_for_mode('html5', additional_data=data)
        self.navigate_to_video()
        self._assert_video_is_not_scored()
        self.video.click_player_button('play')

        # Play the video until the end.
        self.video.wait_for_state('finished');

        self._assert_video_is_scored_successfully()
        self._assert_video_is_graded_successfully()
