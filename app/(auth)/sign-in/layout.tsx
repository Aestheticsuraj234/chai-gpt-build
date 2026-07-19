import React from 'react'

/**
 * Centered layout wrapper for authentication pages (sign-in).
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className='flex min-h-screen items-center justify-center bg-slate-950 '>
      <div className='w-full bg-slate-950/95 p-4 shadow-xl shadow-black/20 sm:p-6'>
        {children}
      </div>
    </section>
  )
}


export default AuthLayout   
  