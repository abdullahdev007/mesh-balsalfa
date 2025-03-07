// app/page.tsx

'use client';  // This is required to let Next.js know this is a client-side component

import { useEffect, useState } from 'react';
import useSocket from './hooks/useSocket';  // Adjust path based on your folder structure

const Home = () => {
  const socket = useSocket();
  const [message, setMessage] = useState('');

  useEffect(() => {

  }, [socket]);

  return (
    <div>
      <h1>Socket.io Example</h1>
      <p>Message from server: {message}</p>
    </div>
  );
};

export default Home;
