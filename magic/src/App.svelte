<script>
  import { Orbis } from "@orbisclub/orbis-sdk";
  import { Magic } from "magic-sdk";

  // Utility function explained in providerUtility.js
  import { providerToBrowserProvider } from "./providerUtility";

  // https://docs.useorbis.com/sdk/introduction/getting-started
  const orbis = new Orbis({});

  // Magic Plug'n'Play docs - https://magic.link/docs/universal/getting-started/quickstart
  const magic = new Magic(
    "YOUR_MAGIC_PUBLIC_ID_HERE", // Obtained from https://dashboard.magic.link/login
    {
      network: "mainnet",
    }
  );

  // Store connection information to display
  let connection;

  // Utility variable to prevent multiple button clicks
  let loading = false;

  const checkExistingSession = async () => {
    // Check if a local orbis session exists
    // More information - https://docs.useorbis.com/sdk/methods/connection/isConnected
    const orbisConnection = await orbis.isConnected();
    if (!orbisConnection) {
      if (await magic.user.isLoggedIn()) {
        connection = { onlyMagic: true };
      }

      return;
    }

    // Check if Magic is connected
    // You can skip this and subsequent checks if you don't
    // need a provider
    if (!(await magic.user.isLoggedIn())) {
      return;
    }

    // Grab the Magic Wallet signer
    const magicWallet = providerToBrowserProvider(
      await magic.wallet.getProvider()
    );
    const signer = await magicWallet.getSigner();

    // Grab Magic wallet's address
    const magicAddress = (await signer.getAddress()).toLowerCase();

    // Grab Orbis DID and extract the address
    const orbisAddress = orbisConnection.did.split(":").pop().toLowerCase();

    // Make sure that Magic and current Orbis user match
    if (magicAddress === orbisAddress) {
      return (connection = orbisConnection);
    }

    // Clear the session
    orbis.logout();
    return (connection = false);
  };

  const connect = async () => {
    loading = true;

    // Log into Magic
    await magic.wallet.connectWithUI();

    // Grab the magic provider
    const magicProvider = await magic.wallet.getProvider();
    // Wrap the provider (more information in providerUtility.js)
    const orbisProvider = providerToBrowserProvider(magicProvider);

    const orbisConnection = await orbis.connect_v2({
      chain: "ethereum",
      provider: orbisProvider,
    });

    console.log("Orbis connection result", { orbisConnection });

    if (orbisConnection.error) {
      if (connection.onlyMagic === true) {
        return (loading = false);
      }

      connection = false;
    } else {
      connection = orbisConnection;
    }

    return (loading = false);
  };

  const disconnect = async () => {
    loading = true;
    orbis.logout();
    await magic.user.logout();
    connection = false;
    return (loading = false);
  };

  // Check for an existing connection
  let checkSession = checkExistingSession();
</script>

<main>
  {#await checkSession}
    <h1>Initializing Magic...</h1>
  {:then _}
    {#if connection}
      {#if connection.onlyMagic === true}
        <div>
          You are already logged into Magic, but not connected to Orbis.
        </div>
        <button disabled={loading} on:click={connect}>Connect to Orbis</button>
        <button disabled={loading} on:click={disconnect}>Disconnect</button>
      {:else}
        <pre>{JSON.stringify(connection, null, 4)}</pre>
        <button disabled={loading} on:click={disconnect}>Disconnect</button>
      {/if}
    {:else}
      <button disabled={loading} on:click={connect}>Connect with Magic</button>
    {/if}
  {:catch}
    <h1>Error initializing Magic</h1>
  {/await}
</main>

<style>
  main {
    margin: auto;
  }
</style>
