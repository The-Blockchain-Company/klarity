{ system ? builtins.currentSystem
, buildNum ? null
}:
let
  klarityPkgs = { cluster ? null }: import ./. {
    inherit buildNum cluster;
    target = system;
    version = "${version}${suffix}";
  };
  shellEnvs = {
    linux = import ./shell.nix { system = "x86_64-linux"; autoStartBackend = true; };
    darwin = import ./shell.nix { system = "x86_64-darwin"; autoStartBackend = true; };
  };
  suffix = if buildNum == null then "" else "-${toString buildNum}";
  version = (builtins.fromJSON (builtins.readFile ./package.json)).version;
  klarityPkgsWithSystem = system:
  let
    table = {
      x86_64-linux = import ./. { target = "x86_64-linux"; };
      x86_64-windows = import ./. { target = "x86_64-windows"; };
      x86_64-darwin = import ./. { target = "x86_64-darwin"; };
    };
  in
    table.${system};

  mkPins = inputs: (klarityPkgs {}).pkgs.runCommand "ifd-pins" {} ''
    mkdir $out
    cd $out
    ${lib.concatMapStringsSep "\n" (input: "ln -sv ${input.value} ${input.key}") (lib.attrValues (lib.mapAttrs (key: value: { inherit key value; }) inputs))}
  '';
  makeJobs = cluster: with klarityPkgs { inherit cluster; }; {
    klarity.x86_64-linux = klarity;
    # below line blows up hydra with 300 GB derivations on every commit
    #installer.x86_64-linux = wrappedBundle newBundle pkgs cluster klarity-bridge.wallet-version;
    #installer.x86_64-windows = (import ./. { inherit cluster; target = "x86_64-windows"; }).windows-installer;
  };
  wrappedBundle = newBundle: pkgs: cluster: bccVersion: let
    backend = "bcc-wallet-${bccVersion}";
    fn = "klarity-${version}-${backend}-${cluster}-${system}${suffix}.bin";
  in pkgs.runCommand fn {} ''
    mkdir -pv $out/nix-support
    cp ${newBundle} $out/${fn}
    echo "file binary-dist $out/${fn}" >> $out/nix-support/hydra-build-products
    size="$(stat $out/${fn} --printf="%s")"
    echo installerSize $(($size / 1024 / 1024)) MB >> $out/nix-support/hydra-metrics
  '';
  lib = (import ./. {}).pkgs.lib;
  clusters = lib.splitString " " (builtins.replaceStrings ["\n"] [""] (builtins.readFile ./installer-clusters.cfg));
  mapOverArches = supportedTree: lib.mapAttrsRecursive (path: value: lib.listToAttrs (map (arch: { name = arch; value = lib.attrByPath path null (klarityPkgsWithSystem arch); }) value)) supportedTree;
  sources = import ./nix/sources.nix;
in {
  inherit shellEnvs;
  inherit ((klarityPkgs {}).pkgs) mono;
  wine = (klarityPkgs {}).wine;
  wine64 = (klarityPkgs {}).wine64;
  tests = (klarityPkgs {}).tests;
  ifd-pins = mkPins {
    inherit (sources) tbco-nix bcc-wallet bcc-shell;
  };
} // (builtins.listToAttrs (map (x: { name = x; value = makeJobs x; }) clusters))
// (mapOverArches {
  klarity-installer = [ "x86_64-linux" "x86_64-darwin" ];
  yaml2json = [ "x86_64-linux" "x86_64-darwin" ];
  bridgeTable = {
    bcc = [ "x86_64-linux" "x86_64-darwin" "x86_64-windows" ];
  };
  bcc-node = [ "x86_64-linux" "x86_64-darwin" "x86_64-windows" ];
})
