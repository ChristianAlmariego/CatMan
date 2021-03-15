#!/bin/bash
if [ ! -d /cygdrive ] ; then
	echo cygwin is not currently available.
	exit
fi
echo "#!/bin/bash" > ~/node.sh
echo "node \"""$""@\"" >> ~/node.sh
chmod u+x ~/node.sh
if [ "`cat ~/node.sh | tr -d \\\\n`" == "#!/bin/bashnode \"\$@\"" ] ; then
	echo cygwin setup is complete
	exit
fi
echo cygwin setup was not successful