import { useState, useRef, useEffect } from 'react'

const FAQ_DATA = [
  {
    question: "How do I register an item?",
    answer: "Go to the 'Register Item' tab, fill in your item details (name, category, description), optionally add a photo, and click Register. Your item will be stored securely on the blockchain."
  },
  {
    question: "How does the AI matching work?",
    answer: "Our AI analyzes the description of found items and matches them against lost items using advanced NLP. It considers keywords, categories, location, and other factors to find the best matches."
  },
  {
    question: "How do I report a found item?",
    answer: "Click 'Report Found', describe what you found, add location details, and optionally use the AI matcher to find the owner. The owner will be notified anonymously."
  },
  {
    question: "How do rewards work?",
    answer: "When reporting an item as lost, you can set a reward amount. This is held securely and released to the finder once you confirm the item has been returned to you."
  },
  {
    question: "Is my identity protected?",
    answer: "Yes! All chat is anonymous. Neither the finder nor the owner sees each other's wallet address until a return is confirmed. Messages are end-to-end encrypted."
  },
  {
    question: "How do I connect my wallet?",
    answer: "Click the 'Connect' button in the navbar to connect your Ethereum wallet (like MetaMask). If you don't have one, you can still browse but won't be able to register items."
  },
  {
    question: "What is the Police Portal?",
    answer: "Police stations can use this portal to log items they've recovered, creating a verifiable blockchain record that connects physical items to digital records."
  },
  {
    question: "How long do reports last?",
    answer: "Lost item reports expire after 90 days if not found. You can renew them before expiry to keep searching."
  },
  {
    question: "How do I contact support?",
    answer: "You can reach us at: support@chainfind.io or through our official channels. For urgent matters, use the in-app chat for item-specific inquiries."
  }
]

const QUICK_ACTIONS = [
  { label: "📦 Register Item", action: "/register" },
  { label: "🚨 Report Lost", action: "/lost" },
  { label: "✅ Report Found", action: "/found" },
  { label: "🤖 Find Matches", action: "/match" },
  { label: "🗺️ View Map", action: "/map" },
  { label: "⭐ Reputation", action: "/reputation" }
]

export default function Chatbot({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([
    { type: 'bot', text: '👋 Hello! I\'m ChainFind Assistant. How can I help you today?' }
  ])
  const [input, setInput] = useState('')
  const [showContact, setShowContact] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    if (!input.trim()) return
    
    const userMsg = { type: 'user', text: input }
    setMessages(prev => [...prev, userMsg])
    
    // Simple keyword matching for FAQ
    const lowerInput = input.toLowerCase()
    let response = null
    
    for (const faq of FAQ_DATA) {
      if (lowerInput.includes(faq.question.toLowerCase().split(' ').slice(0, 3).join(' ')) || 
          faq.question.toLowerCase().split(' ').some(word => lowerInput.includes(word))) {
        response = faq.answer
        break
      }
    }
    
    if (!response) {
      // Default responses based on keywords
      if (lowerInput.includes('contact') || lowerInput.includes('email') || lowerInput.includes('phone')) {
        setShowContact(true)
        response = 'I\'ll show you our contact information.'
      } else if (lowerInput.includes('help')) {
        response = 'I can help you with: registering items, reporting found/lost items, AI matching, rewards, wallet connection, and more. What would you like to know?'
      } else if (lowerInput.includes('thank')) {
        response = 'You\'re welcome! 😊 Is there anything else I can help you with?'
      } else {
        response = 'I\'m not sure about that. Would you like to speak with our support team? Or browse our quick actions below!'
      }
    }
    
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: response }])
    }, 500)
    
    setInput('')
  }

  const handleQuickAction = (action) => {
    setMessages(prev => [...prev, { type: 'user', text: 'Show me ' + action.label }])
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: `Great! Let me take you to ${action.label}.` }])
      if (onNavigate) onNavigate(action.action)
    }, 500)
  }

  const handleFaqClick = (faq) => {
    setMessages(prev => [...prev, { type: 'user', text: faq.question }])
    setTimeout(() => {
      setMessages(prev => [...prev, { type: 'bot', text: faq.answer }])
    }, 300)
  }

  const buttonStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    boxShadow: '0 4px 15px rgba(251, 191, 36, 0.4)'
  }

  const botBubbleStyle = {
    background: 'rgba(251, 191, 36, 0.1)',
    border: '1px solid rgba(251, 191, 36, 0.2)'
  }

  const userBubbleStyle = {
    background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)',
    color: '#1c1917'
  }

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full flex items-center justify-center text-2xl animate-float"
        style={buttonStyle}
        title="Chat with us"
      >
        💬
      </button>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[90vw] rounded-2xl overflow-hidden" 
      style={{ background: '#292524', border: '1px solid rgba(251, 191, 36, 0.3)', boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, #fbbf24 0%, #f97316 100%)' }}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-xl">🤖</div>
          <div>
            <div className="font-bold text-black">ChainFind Assistant</div>
            <div className="text-xs text-black/70">Online • Quick Help</div>
          </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-black/70 hover:text-black text-2xl">✕</button>
      </div>

      {/* Messages */}
      <div className="h-80 overflow-y-auto p-4 flex flex-col gap-3" style={{ background: '#1c1917' }}>
        {messages.map((msg, i) => (
          <div key={i} className={`p-3 rounded-xl max-w-[85%] ${msg.type === 'user' ? 'self-end' : 'self-start'}`}
            style={msg.type === 'user' ? userBubbleStyle : botBubbleStyle}>
            <div className="text-sm" style={msg.type === 'user' ? {} : { color: '#fef3c7' }}>{msg.text}</div>
          </div>
        ))}
        
        {/* Quick Actions */}
        {messages.length <= 2 && (
          <div className="mt-2">
            <div className="text-xs mb-2" style={{ color: '#78716c' }}>Quick Actions:</div>
            <div className="flex flex-wrap gap-2">
              {QUICK_ACTIONS.slice(0, 4).map((action, i) => (
                <button key={i} onClick={() => handleQuickAction(action)}
                  className="px-3 py-1.5 rounded-lg text-xs transition-all hover:scale-105"
                  style={{ background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(251, 191, 36, 0.3)', color: '#fbbf24' }}>
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* FAQ Suggestions */}
        {messages.length <= 4 && (
          <div className="mt-2">
            <div className="text-xs mb-2" style={{ color: '#78716c' }}>Common Questions:</div>
            <div className="flex flex-col gap-2">
              {FAQ_DATA.slice(0, 4).map((faq, i) => (
                <button key={i} onClick={() => handleFaqClick(faq)}
                  className="p-2 rounded-lg text-left text-xs transition-all hover:bg-white/5"
                  style={{ color: '#a8a29e', border: '1px solid #44403c' }}>
                  ❓ {faq.question}
                </button>
              ))}
            </div>
          </div>
        )}
        
        {/* Contact Section */}
        {showContact && (
          <div className="p-3 rounded-xl mt-2" style={{ background: 'rgba(251, 191, 36, 0.1)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
            <div className="text-sm font-bold mb-2" style={{ color: '#fbbf24' }}>📞 Contact Us</div>
            <div className="text-xs space-y-1" style={{ color: '#a8a29e' }}>
              <div>📧 Email: support@chainfind.io</div>
              <div>🌐 Website: chainfind.io</div>
              <div>📱 Telegram: @chainfind</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 flex gap-2" style={{ background: '#292524', borderTop: '1px solid #44403c' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Ask a question..."
          className="flex-1 px-3 py-2 rounded-lg text-sm"
          style={{ background: '#1c1917', border: '1px solid #44403c', color: '#fef3c7', outline: 'none' }}
        />
        <button onClick={handleSend} className="px-4 py-2 rounded-lg text-sm font-medium"
          style={buttonStyle}>
          Send
        </button>
      </div>
    </div>
  )
}

