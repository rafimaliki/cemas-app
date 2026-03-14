const LoginButton = () => {
  return (
    <button
      onClick={() =>
        (window.location.href = `${import.meta.env.VITE_BACKEND_URL}/api/auth/google`)
      }
      className="cursor-pointer flex items-center space-x-3 px-4 py-2 m-4 rounded-full border border-gray-300 shadow-md bg-white hover:shadow-lg transition-all"
    >
      <img src="/google-icon.svg" alt="Google" width={20} height={20} />
      <span className="text-gray-700 font-medium text-sm">
        Sign in with Google
      </span>
    </button>
  )
}

export default LoginButton
