##########################################################
###############          Selfnode          ###############
############### Bcc Node Configuration ###############
##########################################################

{
  ##### Locations #####

  GenesisFile = ../utils/bcc/selfnode/selfnode-cole-genesis.json;

  ##### Core protocol parameters #####

  # This is the instance of the Shardagnostic family that we are running.
  # The node also supports various test and mock instances.
  # "RealPBFT" is the real (ie not mock) (permissive) OBFT protocol, which
  # is what we use on mainnet in Cole era.
  Protocol = "RealPBFT";

  # The mainnet does not include the network magic into addresses. Testnets do.
  RequiresNetworkMagic = "RequiresMagic";

  # Bounds the proportion of the latest K
  # blocks which is allowed to be signed by any single key.
  PBftSignatureThreshold = 1.1;

  ##### Update system parameters #####

  # This protocol version number gets used by block producing nodes as part
  # part of the system for agreeing on and synchronising protocol updates.
  LastKnownBlockVersion-Major = 0;
  LastKnownBlockVersion-Minor = 0;
  LastKnownBlockVersion-Alt = 0;

  # In the Cole era some software versions are also published on the chain.
  # We do this only for Cole compatibility now.
  ApplicationName = "bcc-sl";
  ApplicationVersion = 0;
}
