####################################
Installing the edX Developer Stack
####################################

**********
Overview
**********

The edX Developer Stack, known as *Devstack* is a Vagrant instance designed for local development. 

Devstack:

* Uses the same system requirements as production. This allows developers to discover and fix system configuration issues early in development.

* Simplifies certain production settings to make development more convenient. For example, `nginx`_ and `gunicorn`_ are disabled in devstack; devstack uses Django's runserver instead.


********************
Components
********************

Devstack includes the following edX components:

* The Learning Management System (LMS)
* edX Studio
* Forums
* Open Response Assessor (ORA)
  


**************************
Knowledge Prerequisites
**************************

To use Devstack, you should:

* Understand basic terminal usage. If you are using a Mac computer, see `Introduction to the Mac OS X Command Line`_.

* Understand Vagrant commands. See the `Vagrant Getting Started`_ guide for more information.




**************************
Software Prerequisites
**************************

To install and run Devstack, you must first install:

* VirtualBox 4.3.10 or higher

* Vagrant 1.5.3 or higher

* An NFS client, if your operating system does not include one. Devstack uses VirtualBox Guest Editions to share folders through NFS. 






.. links

.. _nginx: http://nginx.com
.. _gunicorn: http://gunicorn.org
.. _Introduction to the Mac OS X Command Line: http://blog.teamtreehouse.com/introduction-to-the-mac-os-x-command-line
.. _Vagrant Getting Started: http://docs.vagrantup.com/v2/getting-started/index.html