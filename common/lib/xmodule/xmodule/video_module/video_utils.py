"""
Module containts utils specific for video_module but not for transcripts.
"""
from xmodule.course_module import CourseDescriptor


def create_youtube_string(video_module):
    """
    Create a string of Youtube IDs from `video_module`'s metadata
    attributes. Only writes a speed if an ID is present in the
    module.  Necessary for backwards compatibility with XML-based
    courses.
    """
    youtube_ids = [
        video_module.youtube_id_0_75,
        video_module.youtube_id_1_0,
        video_module.youtube_id_1_25,
        video_module.youtube_id_1_5
    ]
    youtube_speeds = ['0.75', '1.00', '1.25', '1.50']
    return ','.join([
        ':'.join(pair)
        for pair
        in zip(youtube_speeds, youtube_ids)
        if pair[1]
    ])


def get_course(video_module):
    """
    Return course for module by course id.
    """
    course_location = CourseDescriptor.id_to_location(video_module.course_id)
    course = video_module.descriptor.runtime.modulestore.get_item(course_location)
    return course
