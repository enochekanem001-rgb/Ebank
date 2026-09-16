const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xppzyyeo'

export const sendVerificationEmail = async (email, code) => {
  const response = await fetch(FORMSPREE_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      _replyto: email,
      subject: 'Your Northstar verification code',
      message: `Your Northstar verification code is ${code}. It expires in 10 minutes.`,
      verification_code: code,
    }),
  })

  if (!response.ok) {
    let details = ''
    try {
      const data = await response.json()
      details = data.errors?.map((error) => error.message).join(', ') || data.error || ''
    } catch {
      // Formspree may return a non-JSON error response.
    }
    throw new Error(details || `Formspree returned HTTP ${response.status}`)
  }
}
