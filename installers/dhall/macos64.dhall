\(cluster : ./cluster.type)      ->
let dataDir = "\${HOME}/Library/Application Support/Klarity${cluster.installDirectorySuffix}"
    --
    --
in
{ name      = "macos64"
, installDirectory = "Klarity${cluster.installDirectorySuffix}"
, macPackageName   = "Klarity${cluster.macPackageSuffix}"
, x509ToolPath       = None Text
, nodeArgs           =
  { logsPrefix       = "${dataDir}/Logs"
  , topology         = None Text
  , updateLatestPath = None Text
  , statePath        = "${dataDir}/state"
  , tlsPath          = None Text
  }
, pass      =
  { statePath           = dataDir
  , workingDir          = dataDir
  , nodeBin             = "\${KLARITY_INSTALL_DIRECTORY}/bcc-node"
  , walletBin           = "\${KLARITY_INSTALL_DIRECTORY}/bcc-wallet"
  , klarityBin         = "\${KLARITY_INSTALL_DIRECTORY}/Frontend"
  , cliPath             = "\${KLARITY_INSTALL_DIRECTORY}/bcc-cli"
  , nodeLogConfig       = None Text
  , nodeLogPath         = None Text

  , walletLogging       = True
  , frontendOnlyMode    = True

  , updaterPath         = None Text
  , updaterArgs         = [] : List Text
  , updateArchive       = None Text
  , updateWindowsRunner = None Text

  , launcherLogsPrefix  = "${dataDir}/Logs/pub/"
  }
}
