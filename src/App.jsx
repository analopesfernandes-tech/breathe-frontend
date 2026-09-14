import { useEffect, useRef, useState } from 'react'
import './App.css'

const API_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:8081'

function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [text, setText] = useState('')
  const [author, setAuthor] = useState('')
  const [source, setSource] = useState('')
  const [category, setCategory] = useState('')
  const [messages, setMessages] = useState([])
  const [successMessage, setSuccessMessage] = useState('')
  const [feedbackType, setFeedbackType] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editText, setEditText] = useState('')
  const [editAuthor, setEditAuthor] = useState('')
  const [editSource, setEditSource] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedFile, setSelectedFile] = useState(null)

  const categoryCounts = {
    PHILOSOPHICAL: messages.filter(
      (message) => message.category === 'PHILOSOPHICAL'
    ).length,

    MOTIVATIONAL: messages.filter(
      (message) => message.category === 'MOTIVATIONAL'
    ).length,

    LITERARY: messages.filter(
      (message) => message.category === 'LITERARY'
    ).length,

    REFLECTION: messages.filter(
      (message) => message.category === 'REFLECTION'
    ).length,

    GRATITUDE: messages.filter(
      (message) => message.category === 'GRATITUDE'
    ).length
  }

  const messagesPerPage = 5
  const totalPages = Math.ceil(messages.length / messagesPerPage)
  const startIndex = (currentPage - 1) * messagesPerPage

  const currentMessages = messages.slice(
    startIndex,
    startIndex + messagesPerPage
  )

  const goToPage = (page) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    const getMessages = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/messages`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }

        const data = await response.json()

        setMessages(data)
      } catch (error) {
        console.error('Failed to fetch messages:', error)
      }
    }

    getMessages()
  }, [])

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        const response = await fetch(
          `${API_URL}/api/auth/me`,
          {
            credentials: 'include'
          }
        )

        if (!response.ok) {
          setIsAuthenticated(false)
          return
        }

        setIsAuthenticated(true)
      } catch (error) {
        console.error('Failed to verify authentication:', error)
        setIsAuthenticated(false)
      }
    }

    checkAuthentication()
  }, [])

  const handleLogin = async (event) => {
    event.preventDefault()

    setLoginError('')

    try {
      const formData = new URLSearchParams()

      formData.append('username', username)
      formData.append('password', password)

      const response = await fetch(
        `${API_URL}/login`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          credentials: 'include',
          body: formData.toString()
        }
      )

      if (!response.ok) {
        setLoginError('Invalid username or password.')
        return
      }

      const authResponse = await fetch(
        `${API_URL}/api/auth/me`,
        {
          credentials: 'include'
        }
      )

      if (!authResponse.ok) {
        setLoginError('Invalid username or password.')
        return
      }

      setIsAuthenticated(true)
    } catch (error) {
      console.error('Failed to log in:', error)
      setLoginError('Unable to connect to the server.')
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!text.trim()) {
      return
    }

    const newMessage = {
      text,
      author,
      source,
      category
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(newMessage)
        }
      )

      if (!response.ok) {
        throw new Error('Failed to add message')
      }

      const data = await response.json()

      setMessages((currentMessages) => [
        ...currentMessages,
        data
      ])

      setText('')
      setAuthor('')
      setSource('')
      setCategory('')

      setFeedbackType('success')
      setSuccessMessage('Message added successfully.')

      setTimeout(() => {
        setSuccessMessage('')
        setFeedbackType('')
      }, 2000)
    } catch (error) {
      console.error('Failed to add message:', error)
    }
  }

  const handleFileChange = async (event) => {
    const file = event.target.files[0]

    if (!file) {
      return
    }

    setSelectedFile(file)

    try {
      const content = await file.text()
      const data = JSON.parse(content)

      if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of messages')
      }

      const validCategories = [
        'PHILOSOPHICAL',
        'MOTIVATIONAL',
        'LITERARY',
        'REFLECTION',
        'GRATITUDE'
      ]

      data.forEach((message, index) => {
        if (!message.text || !message.text.trim()) {
          throw new Error(
            `Message ${index + 1} is missing text`
          )
        }

        if (!validCategories.includes(message.category)) {
          throw new Error(
            `Message ${index + 1} has an invalid category`
          )
        }
      })
    } catch (error) {
      console.error('Failed to validate JSON:', error)
    }
  }

  const importMessages = async () => {
    if (!selectedFile) {
      return
    }

    try {
      const content = await selectedFile.text()
      const data = JSON.parse(content)

      if (!Array.isArray(data)) {
        throw new Error('JSON must contain an array of messages')
      }

      const validCategories = [
        'PHILOSOPHICAL',
        'MOTIVATIONAL',
        'LITERARY',
        'REFLECTION',
        'GRATITUDE'
      ]

      data.forEach((message, index) => {
        if (!message.text || !message.text.trim()) {
          throw new Error(
            `Message ${index + 1} is missing text`
          )
        }

        if (!validCategories.includes(message.category)) {
          throw new Error(
            `Message ${index + 1} has an invalid category`
          )
        }
      })

      const response = await fetch(
        `${API_URL}/api/messages/import`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(data)
        }
      )

      if (!response.ok) {
        throw new Error(
          `Import failed (${response.status})`
        )
      }

      const importedMessages = await response.json()

      setMessages((currentMessages) => [
        ...currentMessages,
        ...importedMessages
      ])

      setSelectedFile(null)

      setFeedbackType('success')
      setSuccessMessage('Messages imported successfully.')

      setTimeout(() => {
        setSuccessMessage('')
        setFeedbackType('')
      }, 2000)
    } catch (error) {
      console.error('Failed to import messages:', error)

      setFeedbackType('error')
      setSuccessMessage(error.message)
    }
  }

  const deleteMessage = async (id) => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this message?'
    )

    if (!confirmed) {
      return
    }

    try {
      const response = await fetch(
        `${API_URL}/api/messages/${id}`,
        {
          method: 'DELETE',
          credentials: 'include'
        }
      )

      if (!response.ok) {
        throw new Error('Failed to delete message')
      }

      setMessages((currentMessages) =>
        currentMessages.filter(
          (message) => message.id !== id
        )
      )
    } catch (error) {
      console.error('Failed to delete message:', error)
    }
  }

  const startEditing = (message) => {
    setEditingId(message.id)
    setEditText(message.text)
    setEditAuthor(message.author || '')
    setEditSource(message.source || '')
    setEditCategory(message.category || '')
  }

  const updateMessage = async (id, updatedMessage) => {
    try {
      const response = await fetch(
        `${API_URL}/api/messages/${id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          body: JSON.stringify(updatedMessage)
        }
      )

      if (!response.ok) {
        throw new Error('Failed to update message')
      }

      const data = await response.json()

      setMessages((currentMessages) =>
        currentMessages.map((message) =>
          message.id === id ? data : message
        )
      )

      setEditingId(null)

      setFeedbackType('success')
      setSuccessMessage('Message updated successfully.')

      setTimeout(() => {
        setSuccessMessage('')
        setFeedbackType('')
      }, 2000)
    } catch (error) {
      console.error('Failed to update message:', error)
    }
  }

  const handleLogout = async () => {
    await fetch(`${API_URL}/logout`, {
      method: 'POST',
      credentials: 'include'
    })

   window.location.href = `${import.meta.env.BASE_URL}admin`
  }

  if (!isAuthenticated) {

    return (
      <main>
        <section className="admin">
          <h1>Breathe Admin</h1>

          <form onSubmit={handleLogin}>
            <label>
              Username
              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value)
                }
                required
              />
            </label>

            <label>
              Password
              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                required
              />
            </label>

            {loginError && (
              <p className="admin-error">
                {loginError}
              </p>
            )}

            <button type="submit">
              Login
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main>
      <section className="admin">
        <button
          className="logout-button"
          onClick={handleLogout}
          aria-label="Logout"
          title="Logout"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path d="M12 3v8" />
            <path d="M7.05 5.95a9 9 0 1 0 9.9 0" />
          </svg>
        </button>

        <h1>Breathe Admin</h1>

        <div className="admin-stats">

          <div className="admin-total">
            <span>{messages.length}</span>
            <p>Total messages</p>
          </div>

          <div className="admin-categories">
            <div>
              <span>{categoryCounts.PHILOSOPHICAL}</span>
              <p>Philosophical</p>
            </div>

            <div>
              <span>{categoryCounts.MOTIVATIONAL}</span>
              <p>Motivational</p>
            </div>

            <div>
              <span>{categoryCounts.LITERARY}</span>
              <p>Literary</p>
            </div>

            <div>
              <span>{categoryCounts.REFLECTION}</span>
              <p>Reflection</p>
            </div>

            <div>
              <span>{categoryCounts.GRATITUDE}</span>
              <p>Gratitude</p>
            </div>
          </div>
        </div>

        <h2>Add a message</h2>

        <form onSubmit={handleSubmit}>
          <label>
            Message
            <textarea
              value={text}
              onChange={(event) =>
                setText(event.target.value)
              }
              required
            />
          </label>

          <label>
            Author
            <input
              type="text"
              value={author}
              onChange={(event) =>
                setAuthor(event.target.value)
              }
            />
          </label>

          <label>
            Source
            <input
              type="text"
              value={source}
              onChange={(event) =>
                setSource(event.target.value)
              }
            />
          </label>

          <label>
            Category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">Select a category</option>
              <option value="PHILOSOPHICAL">
                PHILOSOPHICAL
              </option>
              <option value="MOTIVATIONAL">
                MOTIVATIONAL
              </option>
              <option value="LITERARY">
                LITERARY
              </option>
              <option value="REFLECTION">
                REFLECTION
              </option>
              <option value="GRATITUDE">
                GRATITUDE
              </option>
            </select>
          </label>

          <button type="submit">
            Add message
          </button>

          {successMessage && (
            <p className={`admin-success ${feedbackType}`}>
              {successMessage}
            </p>
          )}
        </form>

        <div className="admin-import">
          <h2>Import messages</h2>

          <label>
            JSON file
            <input
              type="file"
              accept=".json,application/json"
              onChange={handleFileChange}
            />
          </label>

          {selectedFile && (
            <p className="admin-import-file">
              {selectedFile.name}
            </p>
          )}

          <button
            type="button"
            onClick={importMessages}
            disabled={!selectedFile}
          >
            Import messages
          </button>
        </div>

        <div className="admin-messages">
          <h2>Messages</h2>

          {currentMessages.map((message) => (
            <article
              className="admin-message"
              key={message.id}
            >
              {message.id === editingId ? (
                <div className="admin-edit-form">
                  <textarea
                    value={editText}
                    onChange={(event) =>
                      setEditText(event.target.value)
                    }
                  />

                  <input
                    type="text"
                    value={editAuthor}
                    onChange={(event) =>
                      setEditAuthor(event.target.value)
                    }
                    placeholder="Author"
                  />

                  <input
                    type="text"
                    value={editSource}
                    onChange={(event) =>
                      setEditSource(event.target.value)
                    }
                    placeholder="Source"
                  />

                  <select
                    value={editCategory}
                    onChange={(event) =>
                      setEditCategory(event.target.value)
                    }
                  >
                    <option value="">Select a category</option>
                    <option value="PHILOSOPHICAL">
                      PHILOSOPHICAL
                    </option>
                    <option value="MOTIVATIONAL">
                      MOTIVATIONAL
                    </option>
                    <option value="LITERARY">
                      LITERARY
                    </option>
                    <option value="REFLECTION">
                      REFLECTION
                    </option>
                    <option value="GRATITUDE">
                      GRATITUDE
                    </option>
                  </select>

                  <button
                    type="button"
                    onClick={() =>
                      updateMessage(message.id, {
                        text: editText,
                        author: editAuthor,
                        source: editSource,
                        category: editCategory
                      })
                    }
                  >
                    Save
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      setEditingId(null)
                    }
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <p className="admin-quote">
                    {message.text}
                  </p>

                  {message.author && (
                    <p className="admin-author">
                      — {message.author}
                    </p>
                  )}

                  {message.source && (
                    <p className="admin-source">
                      {message.source}
                    </p>
                  )}

                  <div className="admin-message-footer">
                    {message.category && (
                      <p className="admin-category">
                        {message.category}
                      </p>
                    )}

                    <button
                      className="edit-button"
                      onClick={() =>
                        startEditing(message)
                      }
                      aria-label="Edit message"
                      title="Edit message"
                    >
                      ✎
                    </button>

                    <button
                      className="delete-button"
                      onClick={() =>
                        deleteMessage(message.id)
                      }
                      aria-label="Delete message"
                      title="Delete message"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M4 7h16" />
                        <path d="M9 7V4h6v3" />
                        <path d="M7 7l1 13h8l1-13" />
                        <path d="M10 11v6" />
                        <path d="M14 11v6" />
                      </svg>
                    </button>
                  </div>
                </>
              )}
            </article>
          ))}

          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                type="button"
                onClick={() =>
                  goToPage(currentPage - 1)
                }
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                ‹
              </button>

              {Array.from(
                { length: totalPages },
                (_, index) => index + 1
              ).map((page) => (
                <button
                  type="button"
                  key={page}
                  className={
                    currentPage === page
                      ? 'active'
                      : ''
                  }
                  onClick={() =>
                    goToPage(page)
                  }
                >
                  {page}
                </button>
              ))}

              <button
                type="button"
                onClick={() =>
                  goToPage(currentPage + 1)
                }
                disabled={
                  currentPage === totalPages
                }
                aria-label="Next page"
              >
                ›
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function Breathe() {
  const introText = 'Breathe is a small space to pause.'

  const [displayedText, setDisplayedText] = useState('')
  const [showDescription, setShowDescription] = useState(false)
  const [showButton, setShowButton] = useState(false)
  const [isTyping, setIsTyping] = useState(true)
  const [message, setMessage] = useState(null)
  const [showMessage, setShowMessage] = useState(false)
  const [isBreathing, setIsBreathing] = useState(false)

  const messageQueue = useRef([])
  const recentMessages = useRef([])

  const shuffleMessages = (messages) => {
    const shuffled = [...messages]

    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))

        ;[shuffled[i], shuffled[j]] = [
          shuffled[j],
          shuffled[i]
        ]
    }

    return shuffled
  }

  const createMessageCycle = (messages) => {
    let shuffled = shuffleMessages(messages)

    const previousMessages = JSON.parse(
      localStorage.getItem('breatheRecentMessages') || '[]'
    )

    let attempts = 0

    while (
      shuffled
        .slice(0, 5)
        .some((message) =>
          previousMessages.includes(message.id)
        ) &&
      attempts < 100
    ) {
      shuffled = shuffleMessages(messages)
      attempts++
    }

    return shuffled
  }

  const showNextMessage = () => {
    setShowMessage(false)
    setIsBreathing(true)

    setTimeout(async () => {
      await getRandomMessage()
      setIsBreathing(false)
    }, 7000)
  }

  const getRandomMessage = async () => {
    try {
      if (messageQueue.current.length === 0) {
        const response = await fetch(
          `${API_URL}/api/messages`
        )

        if (!response.ok) {
          throw new Error('Failed to fetch messages')
        }

        const data = await response.json()

        if (data.length === 0) {
          throw new Error('No messages available')
        }

        messageQueue.current = createMessageCycle(data)
      }

      const nextMessage = messageQueue.current.shift()

      setMessage(nextMessage)
      setShowMessage(true)

      recentMessages.current = [
        ...recentMessages.current,
        nextMessage.id
      ].slice(-5)

      localStorage.setItem(
        'breatheRecentMessages',
        JSON.stringify(recentMessages.current)
      )
    } catch (error) {
      console.error('Failed to get random message:', error)
    }
  }

    const warmUpBackend = async () => {
    try {
      await fetch(`${API_URL}/api/messages`, {
        method: 'GET'
      })
    } catch (error) {
      console.error('Backend warm-up failed:', error)
    }
  }

  useEffect(() => {
     warmUpBackend()
     
    let typingInterval
    let descriptionTimeout
    let buttonTimeout

    const startTyping = setTimeout(() => {
      let index = 0

      typingInterval = setInterval(() => {
        setDisplayedText(
          introText.slice(0, index + 1)
        )

        index++

        if (index === introText.length) {
          clearInterval(typingInterval)

          setIsTyping(false)

          descriptionTimeout = setTimeout(() => {
            setShowDescription(true)
          }, 1000)

          buttonTimeout = setTimeout(() => {
            setShowButton(true)
          }, 3000)
        }
      }, 55)
    }, 6000)

    return () => {
      clearTimeout(startTyping)
      clearInterval(typingInterval)
      clearTimeout(descriptionTimeout)
      clearTimeout(buttonTimeout)
    }
  }, [])

  return (
    <main>
      <section className="breathe-card">
        {!showMessage && !isBreathing && (
          <h1 className="breathe-title">
            Breathe
          </h1>
        )}

        <div className="content-stage">
          {isBreathing ? (
            <div className="breathing-pause">
              <h1 className="breathe-title">
                Breathe
              </h1>
            </div>
          ) : !showMessage ? (
            <div className="intro">
              <p className="typing-text">
                {displayedText}
                {isTyping && (
                  <span className="cursor">|</span>
                )}
              </p>

              {showDescription && (
                <div className="description">
                  <p>Take a moment. Read. Reflect.</p>
                  <p>Breathe.</p>
                </div>
              )}

              {showButton && (
                <button
                  className="discover-button"
                  onClick={getRandomMessage}
                >
                  Show me a message
                </button>
              )}
            </div>
          ) : (
            <div className="message">
              <p className="quote">
                {message.text}
              </p>

              {message.author && (
                <p className="author">
                  — {message.author}
                </p>
              )}

              {message.source && (
                <p className="source">
                  {message.source}
                </p>
              )}

              <button
                className="another-button"
                onClick={showNextMessage}
              >
                Show me another
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  )
}

function App() {
  if (window.location.pathname.endsWith('/admin')) {
    return <Admin />
  }

  return <Breathe />
}

export default App

