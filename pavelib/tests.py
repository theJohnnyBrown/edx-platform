from paver.easy import *
from pavelib import assets, prereqs, js_test
from .utils import test_utils
from .utils.envs import Env
import os

__test__ = False  # do not collect

TEST_TASK_DIRS = []

dirs = os.listdir('{}/common/lib'.format(Env.REPO_ROOT))

for dir in dirs:
    if os.path.isdir(os.path.join('{}/common/lib'.format(Env.REPO_ROOT), dir)):
        TEST_TASK_DIRS.append(os.path.join('common/lib', dir))


def run_under_coverage(cmd, root):
    cmd0, cmd_rest = cmd.split(" ", 1)
    # We use "python -m coverage" so that the proper python will run the importable coverage
    # rather than the coverage that OS path finds.

    cmd = "python -m coverage run --rcfile={root}/.coveragerc `which {cmd0}` {cmd_rest}".format(
        root=root, cmd0=cmd0, cmd_rest=cmd_rest)
    return cmd


def run_tests(system, report_dir, test_id=None, failed_only=False, fail_fast=False):

    # If no test id is provided, we need to limit the test runner
    # to the Djangoapps we want to test.  Otherwise, it will
    # run tests on all installed packages.

    # We need to use $DIR/*, rather than just $DIR so that
    # django-nose will import them early in the test process,
    # thereby making sure that we load any django models that are
    # only defined in test files.
    default_test_id = "{system}/djangoapps/* common/djangoapps/*".format(system=system)

    if system in ('lms', 'cms'):
        default_test_id += " {system}/lib/*".format(system=system)

    if system == 'lms':
        default_test_id += " {system}/tests.py".format(system=system)

    if not test_id:
        test_id = default_test_id
   
    # Handle "--failed" as a special case: we want to re-run only
    # the tests that failed within our Django apps
    # This sets the --failed flag for the nosetests command, so this 
    # functionality is the same as described in the nose documentation
    if failed_only:
        test_id = "{default_test_id} --failed".format(default_test_id=default_test_id)

    # This makes it so we use nose's fail-fast feature in two cases. 
    # Case 1: --fail_fast is passed as an arg in the paver command
    # Case 2: The environment variable TESTS_FAIL_FAST is set as True
    if fail_fast or ('TESTS_FAIL_FAST' in os.environ and os.environ['TEST_FAIL_FAST']):
        test_id = "{test_id} --stop".format(test_id=test_id)

    cmd = './manage.py {system} test {test_id} --traceback --settings=test'.format(
        system=system, test_id=test_id)

    try:
        test_utils.test_sh(run_under_coverage(cmd, system))
    finally:
        test_utils.clean_mongo()

@task
@needs([
    'pavelib.utils.test_utils.clean_test_files',
    'pavelib.prereqs.install_prereqs', 
])
@cmdopts([
    ("system=", "s", "System to act on"),
    ("test_id=", "t", "Test id"),
    ("failed", "f", "Run only failed tests"),
    ("fail_fast", "x", "Run only failed tests"),
])
def test_system(options):
    """
    Run all django tests on our djangoapps for system
    """
    system = getattr(options, 'system', 'lms')

    # TODO: Fix the tests so that collectstatic isn't needed
    args = [system, '--settings=test']#, '--skip-collect'] 
    call_task('pavelib.assets.update_assets', args=args)

    fasttest(options)


@task
@needs('pavelib.utils.test_utils.clean_reports_dir')
@cmdopts([
    ("system=", "s", "System to act on"),
    ("test_id=", "t", "Test id"),
])
def fasttest(options):
    """
    Run the tests without running collectstatic
    """
    system = getattr(options, 'system', 'lms')
    test_id = getattr(options, 'test_id', None)
    failed_only = getattr(options, 'failed', False)
    fail_fast = getattr(options, "fail_fast", False)

    msg = test_utils.colorize('\n{line}\n Running tests for {system} \n{line}\n'.format(system=system, line='='*40), 'GREEN')
    sys.stdout.write(msg)
    sys.stdout.flush()

    report_dir, test_id_dir, test_ids = test_utils.check_for_required_dirs(system)

    run_tests(system, report_dir, test_id, failed_only, fail_fast)


@task
@needs([
    'pavelib.utils.test_utils.clean_test_files',
    'pavelib.utils.test_utils.clean_reports_dir',
    'pavelib.prereqs.install_prereqs', 
])
@cmdopts([
    ("lib=", "l", "lib to test"),
    ("test_id=", "t", "Test id"),
    ("failed", "f", "Run only failed tests"),
    ("fail_fast", "x", "Run only failed tests"),
])
def test_lib(options):
    """
    Run tests for common lib
    """

    lib = getattr(options, 'lib', '')
    test_id = getattr(options, 'test_id', lib)
    failed_only = getattr(options, 'failed', False)
    fail_fast = getattr(options, "fail_fast", False)

    if not lib:
        raise Exception(test_utils.colorize('Missing required arg. Please specify --lib, -l', 'RED'))

    report_dir, test_id_dir, test_ids = test_utils.check_for_required_dirs(lib)

    if os.path.exists(os.path.join(report_dir, "nosetests.xml")):
        os.environ['NOSE_XUNIT_FILE'] = os.path.join(report_dir, "nosetests.xml")

    msg = test_utils.colorize('\n{line}\n Running tests for {lib} \n{line}\n\n'.format(lib=lib, line='='*40), 'GREEN')
    sys.stdout.write(msg)
    sys.stdout.flush()

    # Handle "--failed" as a special case: we want to re-run only
    # the tests that failed within our Django apps
    # This sets the --failed flag for the nosetests command, so this 
    # functionality is the same as described in the nose documentation
    if failed_only:
        test_id = "{test_id} --failed".format(test_id=test_id)

    # This makes it so we use nose's fail-fast feature in two cases. 
    # Case 1: --fail_fast is passed as an arg in the paver command
    # Case 2: The environment variable TESTS_FAIL_FAST is set as True
    if fail_fast or ('TESTS_FAIL_FAST' in os.environ and os.environ['TEST_FAIL_FAST']):
        test_id = "{test_id} --stop".format(test_id=test_id)

    cmd = "nosetests --id-file={test_ids} {test_id}".format(
        test_ids=test_ids, test_id=test_id)

    try:
        test_utils.test_sh(run_under_coverage(cmd, lib))
    finally:
        test_utils.clean_mongo()

@task
@cmdopts([
    ("lib=", "l", "lib to test"),
])
def fasttest_lib(options):
    """
    Run tests for common lib (aliased for backwards compatibility)"
    Run all django tests on our djangoapps for system
    """
    test_lib(options)


@task
def test_python(options):
    """
    Run all python tests
    """

    setattr(options, 'system', 'cms')
    test_system(options)

    setattr(options, 'system', 'lms' )
    test_system(options)

    for dir in TEST_TASK_DIRS:
        setattr(options, 'lib', dir)
        test_lib(options)


@task
def test(options):
    """
    Run all tests
    """
    test_python(options)
    js_test.test_js_coverage(options)
    call_task('pavelib.docs.build_docs')


@task
def coverage():
    """
    Build the html, xml, and diff coverage reports
    """
    for dir in TEST_TASK_DIRS:
        report_dir = os.path.join(Env.REPORT_DIR, dir)

        if os.path.isfile(os.path.join(report_dir, '.coverage')):
            # Generate the coverage.py HTML report
            sh("coverage html --rcfile={dir}/.coveragerc".format(dir=dir))

            # Generate the coverage.py XML report
            sh("coverage xml -o {report_dir}/coverage.xml --rcfile={dir}/.coveragerc".format(
                report_dir=report_dir, dir=dir))

    # Find all coverage XML files (both Python and JavaScript)
    xml_reports = []

    for subdir, dirs, files in os.walk(Env.REPORT_DIR):
        if 'coverage.xml' in files:
            xml_reports.append(os.path.join(subdir, 'coverage.xml'))

    if len(xml_reports) < 1:
        paver_utils.print_red("No coverage info found.  Run `paver test` before running `paver coverage`.")
    else:
        xml_report_str = ' '.join(xml_reports)
        diff_html_path = os.path.join(Env.REPORT_DIR, 'diff_coverage_combined.html')

        # Generate the diff coverage reports (HTML and console)
        sh("diff-cover {xml_report_str} --html-report {diff_html_path}".format(
            xml_report_str=xml_report_str, diff_html_path=diff_html_path))
        sh("diff-cover {xml_report_str}".format(xml_report_str=xml_report_str))
        print("\n")
