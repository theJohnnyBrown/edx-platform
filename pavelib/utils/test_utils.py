from paver.easy import *
import os
import subprocess
from process import kill_process
from .envs import Env

__test__ = False  # do not collect


def test_sh(cmd):
    """
    Runs a command in a subprocess and waits for it to finish
    """
    kwargs = {'shell': True, 'cwd': None}
    process = None
    
    try:
        print cmd
        process = subprocess.Popen(cmd, **kwargs)
        process.communicate()

    except KeyboardInterrupt:
        kill_process(process)

    else:
        return


@task
def clean_test_files():
    """
    Clean fixture files used by tests and .pyc files
    """
    sh("git clean -fqdx test_root/logs test_root/data test_root/staticfiles test_root/uploads")
    sh("find . -type f -name \"*.pyc\" -delete")
    sh("rm -rf test_root/log/auto_screenshots/*")


def clean_dir(dir):
    """
    Clean coverage files, to ensure that we don't use stale data to generate reports.
    """
    # We delete the files but preserve the directory structure
    # so that coverage.py has a place to put the reports.
    sh('find {dir} -type f -delete'.format(dir=dir))


@task
def clean_reports_dir():
    """
    Clean coverage files, to ensure that we don't use stale data to generate reports.
    """
    # We delete the files but preserve the directory structure
    # so that coverage.py has a place to put the reports.
    clean_dir(Env.REPORT_DIR)


@task
def clean_mongo():
    """
    Clean mongo test databases
    """
    sh("mongo {repo_root}/scripts/delete-mongo-test-dbs.js".format(repo_root=Env.REPO_ROOT))


def check_for_required_dirs(lib):
    """
    Makes sure that the reports directory and the nodeids directory are present.
    """
    report_dir = os.path.join(Env.REPORT_DIR, lib)
    if not os.path.exists(report_dir):
        os.makedirs(report_dir)

    test_id_dir = os.path.join(Env.TEST_DIR, lib)
    if not os.path.exists(test_id_dir):
        os.makedirs(test_id_dir)

    # no need to create test_ids file, since nose will do that
    test_ids = os.path.join(test_id_dir, '.noseids')

    return report_dir, test_id_dir, test_ids 

