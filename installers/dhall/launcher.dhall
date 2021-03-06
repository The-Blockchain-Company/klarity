\(cluster : ./cluster.type) ->
\(os      : ./os.type)      ->
{ nodeTimeoutSec = 60
, walletArgs     = [] : List Text
, logsPrefix     = os.nodeArgs.logsPrefix
, tlsPath        = os.nodeArgs.tlsPath
, x509ToolPath   = os.x509ToolPath
, nodeImplementation = "bcc"
, nodeArgs =
    [
    ] : List Text
} // os.pass
