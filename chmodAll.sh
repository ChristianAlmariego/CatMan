#!/bin/bash
find /opt/websphere/catalogManager/* -name \*.sh -exec chmod u+x {} \;

#chmod all xml files inside dataCleanUp module
#find /opt/websphere/catalogManager/scripts/dataCleanUp/* -name \*.xml -exec chmod u+x {} \;
