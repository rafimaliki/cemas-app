export async function fetchUsers() {
  try {
    const res = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/users`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    })

    if (!res.ok) {
      throw new Error(`HTTP error! Status: ${res.status}`)
    }

    const data = await res.json()

    const transformed = data.data.map(({ avatar, ...rest }) => ({
      ...rest,
      picture: avatar,
    }))

    return transformed
  } catch (err) {
    console.error('Failed to fetch users:', err)
    throw err
  }
}
