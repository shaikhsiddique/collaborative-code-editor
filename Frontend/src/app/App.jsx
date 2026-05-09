import React, { useRef, useMemo, useState, useEffect } from 'react'
import Editor from '@monaco-editor/react';
import { MonacoBinding } from "y-monaco"
import * as Y from "yjs"
import { SocketIOProvider } from "y-socket.io"

function App() {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const providerRef = useRef(null);
  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText("monaco"), [ydoc])
  const [username, setUsername] = useState(() => {
    return new URLSearchParams(window.location.search).get("username") || ""
  })
  const [users, setUsers] = useState([])
  const [editorReady, setEditorReady] = useState(false)

  const handleMount = (editor) => {
    editorRef.current = editor
    setEditorReady(true) // Trigger the effect
  };

  const handleJoin = (e) => {
    e.preventDefault()
    setUsername(e.target.username.value)
    window.history.pushState({}, "", "?username=" + e.target.username.value)
  }

  useEffect(() => {
    // Only run when BOTH username exists AND editor is ready
    if (!username || !editorReady || !editorRef.current) {
      return
    }

    console.log("Setting up collaboration...")

    const provider = new SocketIOProvider(
      "http://localhost:3000",
      "monaco",
      ydoc,
      {
        autoConnect: true
      }
    );

    providerRef.current = provider;

    provider.awareness.setLocalStateField("user", { username })

    const updateUsers = () => {
      const states = Array.from(provider.awareness.getStates().values())
      console.log("User states:", states)
      setUsers(states.filter(state => state.user && state.user.username).map(state => state.user))
    }

    // Initial user list
    updateUsers()
    
    // Listen for changes
    provider.awareness.on("change", updateUsers)

    const handleBeforeUnload = () => {
      provider.awareness.setLocalStateField("user", null)
    }

    window.addEventListener("beforeunload", handleBeforeUnload)

    // Create Monaco binding
    const monacoBinding = new MonacoBinding(
      yText,
      editorRef.current.getModel(),
      new Set([editorRef.current]),
      provider.awareness
    );

    bindingRef.current = monacoBinding;

    console.log("Collaboration setup complete!")

    return () => {
      console.log("Cleaning up collaboration...")
      if (bindingRef.current) {
        bindingRef.current.destroy()
      }
      provider.disconnect()
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [username, editorReady, ydoc, yText])

  if (!username) {
    return <main className="h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center">
      <form
        onSubmit={handleJoin}
        className="flex flex-col gap-4 border-white border-2 p-8">
        <input
          type="text"
          placeholder="Enter your username"
          className="p-2 rounded-lg bg-gray-800 text-white"
          name="username"
          required
        />
        <button
          className="p-2 rounded-lg bg-amber-50 text-gray-950 font-bold"
        >
          Join
        </button>
      </form>
    </main>
  }

  return (
    <div className='h-screen w-full bg-black flex gap-4 p-6'>
      <div className="left h-full w-1/5 bg-white rounded-lg">
        <h2 className="text-2xl font-bold p-4 border-b border-gray-300">Users</h2>
        <ul className="p-4">
          {users.length === 0 ? (
            <li className="p-2 text-gray-500">No users connected</li>
          ) : (
            users.map((user, index) => (
              <li key={index} className="p-2 bg-gray-800 text-white rounded mb-2">
                {user.username}
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="right h-full w-4/5 bg-gray-900 rounded-lg p-4">
        <Editor 
          height="90vh" 
          defaultLanguage="javascript" 
          defaultValue="// Start typing together..." 
          onMount={handleMount}
          theme="vs-dark"
        />
      </div>
    </div>
  )
}

export default App