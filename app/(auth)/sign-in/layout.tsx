import React from 'react'

/**
 * Centered layout wrapper for authentication pages (sign-in).
 */
const AuthLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <section className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10">
      <div className="w-full max-w-md mx-auto rounded-2xl bg-slate-950/95 p-6 shadow-xl shadow-black/20">
        <div className="flex w-full items-center justify-center">
          {children}
        </div>
      </div>
    </section>
  )
}


export default AuthLayout   
  