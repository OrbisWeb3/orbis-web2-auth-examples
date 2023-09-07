<script>
  import { Orbis } from "@orbisclub/orbis-sdk";
  import { Web3Auth } from "@web3auth/modal";

  // Utility function explained in providerUtility.js
  import { providerToBrowserProvider } from "./providerUtility";

  // https://docs.useorbis.com/sdk/introduction/getting-started
  const orbis = new Orbis({});

  // Web3Auth Modal docs - https://web3auth.io/docs/sdk/pnp/web/modal/usage
  const web3auth = new Web3Auth({
    uiConfig: {
      appName: "Orbis Social Demo", // Your dApp Name
      appLogo: "https://useorbis.com/img/orbis-logo.png", // Your dApp Logo URL
      theme: "dark", // "light" | "dark" | "auto"
      loginMethodsOrder: ["google", "apple", "twitter"],
      primaryButton: "socialLogin",
    },
    chainConfig: {
      chainNamespace: "eip155",
      chainId: "0x1",
    },
    clientId: "YOUR_CLIENT_ID_HERE", // Obtain from https://dashboard.web3auth.io/
    web3AuthNetwork: "cyan", // The network you set up your Web3Auth project on
  });

  // Store connection information to display
  let connection;

  // Utility variable to prevent multiple button clicks
  let loading = false;

  // Initialize the Web3Auth modal
  // Consolidate Web3Auth documentation for more information
  const initializeWeb3Auth = async () => {
    await web3auth.initModal({
      modalConfig: {},
    });

    await checkExistingSession();
  };

  const checkExistingSession = async () => {
    // If Web3Auth is connected we can connect to Orbis siltently
    if (!web3auth.connected) {
      return;
    }

    return connect();

    // Alternatively, you could use
    // const connection = await orbis.isConnected()
    // because session will be locally preserved for up to 3 months
    // It depends on your use case and whether you need the provider
    // More information - https://docs.useorbis.com/sdk/methods/connection/isConnected
  };

  const connect = async () => {
    loading = true;

    const web3AuthProvider = await web3auth.connect();
    const orbisProvider = providerToBrowserProvider(web3AuthProvider);

    const orbisConnection = await orbis.connect_v2({
      chain: "ethereum",
      provider: orbisProvider,
    });

    console.log("Orbis connection result", { orbisConnection });

    connection =
      orbisConnection.error || !orbisConnection.did ? false : orbisConnection;
    return (loading = false);
  };

  const disconnect = async () => {
    loading = true;
    orbis.logout();
    await web3auth.logout();
    connection = false;
    return (loading = false);
  };

  // Initialize Web3Auth and check for an existing connection
  let web3authPromise = initializeWeb3Auth();
</script>

<main>
  {#await web3authPromise}
    <h1>Initializing Web3Auth...</h1>
  {:then _}
    {#if connection}
      <pre>{JSON.stringify(connection, null, 4)}</pre>
      <button disabled={loading} on:click={disconnect}>Disconnect</button>
    {:else}
      <button disabled={loading} on:click={connect}
        >Connect with Web3Auth</button
      >
    {/if}
  {:catch}
    <h1>Error initializing Web3Auth</h1>
  {/await}
</main>

<style>
  main {
    margin: auto;
  }
</style>
