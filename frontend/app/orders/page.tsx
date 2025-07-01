'use client';
import { useEffect, useState } from 'react'

function page() {
  const token = localStorage.getItem('token')
  const [orders, setOrders] = useState({})
  
  useEffect(() =>{
    if(!token){
      console.error("Unauthoried access")
      return;
    }

  }, [])
  return (
    <div>page</div>
  )
}

export default page