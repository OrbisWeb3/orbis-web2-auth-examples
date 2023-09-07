import { BrowserProvider } from "ethers/providers"

// Due to some underlying dependencies, we need to
// wrap any provider and make it act as Metamask
export const providerToBrowserProvider = _provider => {
    const provider = new BrowserProvider(_provider)

    return walletToBrowserProvider(provider)
}

export const walletToBrowserProvider = provider => {
    provider.enable = async () => [await provider.getSigner().then(signer => signer.getAddress())]

    provider.request = async payload => {
        if (payload.method === "personal_sign") {
            const signer = await provider.getSigner()
            const message = payload.params[0]

            if (/^(0x)?[0-9A-Fa-f]+$/i.test(message)) {
                const bufferMessage = Buffer.from(message.startsWith("0x") ? message.slice(2) : message, "hex")
                return signer.signMessage(bufferMessage)
            }

            return signer.signMessage(message)
        }

        return provider.send(payload.method, payload.params || []);
    }

    return provider
}