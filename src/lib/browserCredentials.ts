interface PasswordCredentialData {
  id: string
  password: string
  name?: string
}

declare global {
  interface Window {
    PasswordCredential?: new (data: PasswordCredentialData) => Credential
  }
}

export async function storeBrowserPassword(email: string, password: string) {
  if (!window.PasswordCredential || !navigator.credentials) return

  try {
    const credential = new window.PasswordCredential({
      id: email,
      password,
      name: email,
    })
    await navigator.credentials.store(credential)
  } catch {
    // Browser may reject outside a secure context or without permission
  }
}
