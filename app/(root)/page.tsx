import { startNewChat } from '@/features/home/actions/start-new-chat'
import { redirect } from 'next/navigation'
import React from 'react'

const page = async() => {
  const conversationId = await startNewChat()
  
  
  redirect(`/c/${conversationId}`)
}

export default page