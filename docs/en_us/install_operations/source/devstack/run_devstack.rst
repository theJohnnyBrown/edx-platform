.. include:: ../links.rst


.. _Running the edX Developer Stack:

####################################
Running the edX Developer Stack
####################################





.. _Connect to the Devstack Virtual Machine:

****************************************
Connect to the Devstack Virtual Machine
****************************************

#. To connect the the Devstack virtual machine, use the SSH command from the
   `devstack` directory.

  .. code-block:: guess

   vagrant ssh

2. To use Devstack and perform any of the tasks described in this section, you
   must connect as the user **edxapp**.

   .. code-block:: guess

    sudo su edxapp

   This command loads the edxapp environment from the file ``/edx/app/edxapp/edxapp_env`` so that ``venv python``, ``rbenv ruby`` and ``rake`` are in your search path.

   This command also sets the current working directory to the edx-platform repository (``/edx/app/edxapp/edx-platform``).


************************************
Set Up Ability to Preview Units
************************************



************************************
Customize the Source Code Location
************************************


************************************
Run the LMS on Devstack
************************************

You run the LMS on Devstack with the file ``lms/envs/devstack.py``. This file overrides production settings for the LMS.

When you start the LMS on Devstack, the command updates requirements and compiles assets, unless you choose the ``fast`` option.

To run the LMS on Devstack:

#. `Connect to the Devstack Virtual Machine`_
#. Run the following command:
   
   .. code-block:: guess

    paver devstack lms

   Or, to start the LMS without updating requirements and compiling assets, use the ``fast`` option:
   
   .. code-block:: guess

    paver devstack --fast lms 

The LMS starts. Open the LMS in your browser at ``http://localhost:8000/``. 

.. note:: Vagrant forwards port 8000 to the LMS server running in the virtual machine.

************************************
Run Studio on Devstack
************************************

You run Studio on Devstack with the file ``cms/envs/devstack.py``. This file overrides production settings for Studio.

When you start Studio on Devstack, the command updates requirements and compiles assets, unless you choose the ``fast`` option.

To run Studio on Devstack:

#. `Connect to the Devstack Virtual Machine`_
#. Run the following command:
   
   .. code-block:: guess

    paver devstack studio

   Or, to start Studio without updating requirements and compiling assets, use the ``fast`` option:
   
   .. code-block:: guess

    paver devstack --fast studio 

Studio starts. Open the LMS in your browser at ``http://localhost:8001/``. 

.. note:: Vagrant forwards port 8001 to the Studio server running in the virtual machine.

************************************
Run Discussions on Devstack
************************************

To run Discussions on Devstack:

#. `Connect to the Devstack Virtual Machine`_
#. Switch to the forum account:
   
   .. code-block:: guess

    sudo su forum

#. Update Ruby requirements. 

   .. code-block:: guess

    bundle install

   .. note:: If you get a message for entering a password to install the bundled RubyGems to the system, you can safely exit by entering ``ctrl-c``.The gems will still be installed correctly for the forum user.

#. Start the Discussion server.
   
   .. code-block:: guess

    ruby app.rb -p 18080

The Discussions service starts. You can access the Discussion API at ``http://localhost:18080/``. 

************************************
Default Accounts on Devstack
************************************

When you install Devstack, the following accounts are created:

  .. list-table::
   :widths: 20 60
   :header-rows: 1

   * - Account
     - Description
   * - staff@example.com
     - A LMS and Studio user with course creation and editing permissions.
   * - verified@example.com
     - An LMS user for testing verified certificates.
   * - audit@example.com
     - An LMS user for testing course auditing.
   * - honor@example.com
     - An LMS user for testing honor code certificates.
