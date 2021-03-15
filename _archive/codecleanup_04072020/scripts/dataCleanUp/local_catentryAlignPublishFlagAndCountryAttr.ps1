$CATMANDIR = "C:\mrjc\workspaces\CatMan\vscode\cmupgrade\"

$TARGETSTORE = "emr"
$TARGETENV = "local"

# test only
$processId = "CatEntCountryExistMissingFlag_CN" 
$countryCode = "CN"

$deleteCountryAttribute = $CATMANDIR + '\scripts\dataCleanUp\catentryCountryPublishFlagAligning\deleteCountryAttribute.js'

node $deleteCountryAttribute $TARGETENV $TARGETSTORE $CATMANDIR $processId $countryCode 
