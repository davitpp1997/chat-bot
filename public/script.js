// Global conversation history to maintain context
// Format of each message strictly: { role: 'user' | 'model', text: string }
const conversationHistory = [];

// DOM Element references
const chatForm = document.getElementById('chat-form');
const userInput = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

/**
 * Automatically scrolls the chat box to the very bottom.
 */
function scrollToBottom() {
  chatBox.scrollTop = chatBox.scrollHeight;
}

/**
 * Creates and appends a message element to the chat box.
 * @param {string} role - The role of the sender ('user', 'model', etc.)
 * @param {string} text - The message content
 * @returns {HTMLElement} The created message element
 */
function appendMessage(role, text) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', role);
  messageElement.textContent = text;
  chatBox.appendChild(messageElement);
  scrollToBottom();
  return messageElement;
}

// Handle form submission
chatForm.addEventListener('submit', async (event) => {
  event.preventDefault();

  // Retrieve user input and clean whitespace
  const messageText = userInput.value.trim();
  if (!messageText) return;

  // 1. Append user message to DOM
  appendMessage('user', messageText);

  // 2. Clear input field immediately
  userInput.value = '';

  // 3. Push to history with strict role 'user'
  conversationHistory.push({ role: 'user', text: messageText });

  // 4. Show a temporary indicator message
  const indicatorText = 'Loadingg...';
  const indicatorElement = appendMessage('model', indicatorText);
  indicatorElement.classList.add('loading');

  try {
    // Make the API call to Node.js backend
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ conversation: conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    // Validate that result is present and not empty
    if (data && typeof data.result === 'string' && data.result.trim() !== '') {
      const aiResponse = data.result.trim();

      // 5. Replace indicator with actual AI response in DOM
      indicatorElement.textContent = aiResponse;
      indicatorElement.classList.remove('loading');
      
      // Save AI response to history with strict role 'model'
      conversationHistory.push({ role: 'model', text: aiResponse });
      
      // Scroll to bottom since content has changed
      scrollToBottom();
    } else {
      // Empty result handled gracefully as an error
      throw new Error('Empty response result received.');
    }
  } catch (error) {
    console.error('Error fetching chatbot response:', error);

    // 6. Gracefully replace the indicator with an error message
    indicatorElement.textContent = 'Gagal mendapatkan respon dari server.';
    indicatorElement.classList.remove('loading');
    indicatorElement.classList.add('error');
    
    // Scroll to bottom to ensure the error message is visible
    scrollToBottom();
  }
});
