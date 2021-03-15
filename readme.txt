Local Project Setup
1) Install NodeJS v6.11.0
	a) Download: https://nodejs.org/dist/v6.11.0/node-v6.11.0-x64.msi
	b) Install nodejs to F:\nodejs\
2) Set up eclipse workspace for CatMan
	a) Start eclipse (coremedia should load by default)
	b) Choose File >> Switch Workspace >> Other
	c) Specify F:\workspace
	d) Eclipse will restart with a blank workspace
	e) Check out https://usazrecp1020.cloudapp.net/svn/catalogmanager/trunk as catalogmanager project
3) Install cygwin
	a) Download installer from https://www.cygwin.com/setup-x86_64.exe to temporary location
	b) Install setup-x86_64.exe to F:\cygwin64 using default configuration
4) Setup cygwin
	a) Start "Cygwin64 Terminal" from the desktop shortcut
	b) Enter command "cd /cygdrive/f/workspace/catalogmanager"
	c) Enter command "./setupcygwin.sh"
	d) Enter command "cd ~" to return to home
	e) Enter command "~/node.sh --version" and result should return "v6.11.0"
5) Plugins - optional
	a) Node Plugin: Help --> Eclipse Marketplace: search for nodeclipse
	b) Bash Plugin: Help --> Install New Software...: http://download.eclipse.org/technology/dltk/updates-dev/5.4
		i)   Dynamic Languages Toolkit - Core Frameworks
		ii)  Dynamic Languages Toolkit - Core Frameworks SDK
		iii) Dynamic Languages Toolkit - Core H2 Index Frameworks
		iv)  Dynamic Languages Toolkit - Core H2 Index Frameworks SDK
		v)   Dynamic Languages Toolkit - ShellEd IDE
		vi)  Restart eclipse and *.sh files should open in the ShellEd Shell Script Editor plugin
