# -*- coding: utf-8 -*-

"""
Acceptance tests for Video grading functionality.
"""

# @TODO
# 1) Verify if grading on percentage works correctly and progress is shown.
# 2) Verify if grading on video finish works correctly and progress is shown.
# 3) Verify if both graders work well.
# 4) Verify if video messages are stored when user navigates between sequential.
# 5) Verify error message and score is not stored (reload page and check progress message).


import json
import requests
from .helpers import UniqueCourseTest
from ..pages.lms.video import VideoPage
from ..pages.lms.tab_nav import TabNavPage
from ..pages.lms.course_nav import CourseNavPage
from ..pages.lms.auto_auth import AutoAuthPage
from ..pages.lms.course_info import CourseInfoPage
from ..fixtures.course import CourseFixture, XBlockFixtureDesc

from .test_video_module import VideoBaseTest


class YouTubeVideoGradedTest(VideoBaseTest):
    """ Test YouTube Video Player """

    def setUp(self):
        super(YouTubeVideoGradedTest, self).setUp()

    def test_video_is_graded(self):
        """
        Scenario: Video component is graded on percent
        Given the course has a Video component in "Youtube" mode
        And I see progress message is "1.0 points possible"
        And I do not see status message
        And I click video button "play"
        Then I see status and progress messages are visible
        And I see progress message is "(1.0 / 1.0 points)"
        And I see status message is "You've received credit for viewing this video."
        """
        data = {'has_score': True, 'scored_on_percent': 1}
        self.metadata = self.metadata_for_mode('youtube', additional_data=data)

        self.navigate_to_video()

        self.assertEquals(self.video.progress_message_text(), '(1.0 points possible)')
        self.assertFalse(self.video.is_status_message_shown())

        self.video.click_player_button('play')
        self.video.wait_for_status_message();

        self.assertEquals(self.video.progress_message_text(), '(1.0 / 1.0 points)')
        self.assertEquals(self.video.status_message_text(), 'You\'ve received credit for viewing this video.')

