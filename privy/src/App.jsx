import { Orbis } from "@orbisclub/orbis-sdk";
import { PrivyProvider, useWallets, usePrivy } from "@privy-io/react-auth";

// Utility function explained in providerUtility.js
import { providerToBrowserProvider } from "./providerUtility";

import { useState, useEffect } from 'react'
import './App.css'

// https://docs.useorbis.com/sdk/introduction/getting-started
const orbis = new Orbis({});

function PrivyComponent() {
  // https://docs.privy.io/guide/frontend/authentication/status
  const privy = usePrivy()
  // https://docs.privy.io/guide/frontend/wallets/overview
  const { wallets } = useWallets()

  const [loading, setLoading] = useState(false)
  const [connection, setConnection] = useState(false)

  const connect = async (wallet) => {
    setLoading(true)
    // Check if the user is authentucated
    if (privy.authenticated) {
      // If no wallet provided, the call didn't come
      // from useEffect
      if (!wallet) return setLoading(false)

      // Fetch the raw Ethereum (request) provider
      const privyProvider = await wallet.getEthereumProvider()
      // Wrap the provider (more information in providerUtility.js)
      const orbisProvider = providerToBrowserProvider(privyProvider)

      const orbisConnection = await orbis.connect_v2({
        chain: "ethereum",
        provider: orbisProvider,
      });

      console.log("Orbis connection result", { orbisConnection });

      if (!orbisConnection.error) {
        setConnection(orbisConnection)
      }
    } else {
      // Initiate Privy login
      // Redirect-based oauth flow (unless e-mail OTP is used)
      privy.login()
    }

    setLoading(false)
  }

  const disconnect = async () => {
    setLoading(true)
    orbis.logout()
    if (privy.authenticated) {
      await privy.logout()
    }
    setLoading(false)
    setConnection(false)
  }

  useEffect(() => {
    // Look for Privy's embedded wallet and 
    // use it to connect to Orbis if it exists
    // https://docs.privy.io/guide/frontend/embedded/usage/address
    const wallet = wallets.find(w => w.walletClientType === "privy")
    if (wallet && !connection) {
      connect(wallet)
    }

    console.log("Current user wallets", { wallets })
  }, [wallets])

  // Alternatively, if you don't need a provider
  // instead of checking for Privy's session,
  // check Orbis local session directly
  // const connection = await orbis.isConnected()
  // More information - https://docs.useorbis.com/sdk/methods/connection/isConnected
  return (
    <main>
      {
        privy.authenticated ?
          <>
            {connection && <pre>{JSON.stringify(connection, null, 4)}</pre> || <h2>Waiting for wallet...</h2>}
            <button disabled={loading} onClick={disconnect}>
              Disconnect
            </button>
          </> :
          <button disabled={loading} onClick={connect}>Connect to Privy</button>
      }
    </main>
  )
}

function App() {
  // https://docs.privy.io/guide/quickstart
  return <PrivyProvider
    config={{
      embeddedWallets: {
        createOnLogin: 'all-users',
        noPromptOnSignature: true
      }
    }}
    appId="YOUR_PRIVY_APP_ID_HERE" // Obtained from the Privy console - https://console.privy.io/
  >
    <PrivyComponent />
  </PrivyProvider>
}

export default App
