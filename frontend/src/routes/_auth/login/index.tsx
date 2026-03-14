import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { motion } from 'framer-motion'
import LoginButton from '@/components/buttons/login-button'

export const Route = createFileRoute('/_auth/login/')({
  component: LoginPage,
})

function LoginPage() {
  const text =
    '"The strength of a system lies not in its rules, but in the discipline to uphold them."'
  const words = text.split(' ')

  const [imageStatus, setImageStatus] = useState<
    'loading' | 'loaded' | 'error'
  >('loading')

  return (
    <div className="flex min-h-screen w-full cursor-default select-none bg-red-400">
      <div className="relative min-h-screen w-[60%] hidden sm:block">
        {imageStatus !== 'error' && (
          <>
            <img
              src="https://images.pexels.com/photos/48148/document-agreement-documents-sign-48148.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
              alt="Document Agreement"
              style={{ objectFit: 'cover', height: '100%' }}
              onLoad={() => setImageStatus('loaded')}
              onError={() => setImageStatus('error')}
              className={`transition-opacity duration-500 ${
                imageStatus === 'loaded' ? 'opacity-100' : 'opacity-0'
              }`}
            />
            <div className="absolute inset-0 bg-black/70"></div>
          </>
        )}

        {imageStatus !== 'loaded' && (
          <>
            <div className="absolute inset-0 min-h-screen bg-gray-700 flex justify-center items-center text-white"></div>
            <div className="absolute inset-0 min-h-screen bg-black/50"></div>
          </>
        )}

        <motion.h1
          className="absolute inset-0 flex text-white text-3xl font-bold p-6 h-fit w-fit"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 3 }}
        >
          CeMaS.
        </motion.h1>

        <motion.div
          className="absolute bottom-10 w-full text-white text-md font-semibold px-6"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.25 } },
          }}
        >
          {words.map((word, index) => (
            <motion.span
              key={index}
              className="inline-block mx-1"
              variants={{
                hidden: { opacity: 0 },
                visible: { opacity: 1, transition: { duration: 0.8 } },
              }}
            >
              {word}
            </motion.span>
          ))}
          <motion.div
            className="mt-2 text-sm font-light text-gray-300 italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: words.length * 0.25 + 0.5, duration: 1 }}
          >
            — Quotes from the developer
          </motion.div>
        </motion.div>
      </div>

      <div className="min-h-screen w-full sm:w-[40%] bg-white flex flex-col justify-center items-center">
        <p className="absolute inset-0 flex justify-center text-black text-3xl font-bold p-6 sm:hidden h-fit w-fit">
          CeMaS.
        </p>
        <p className="text-2xl font-bold text-black">Sign in</p>
        <p className="font-normal text-sm text-gray-400">
          Please sign in with your Google account
        </p>
        <LoginButton />
      </div>
    </div>
  )
}
