document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const imageUpload = document.getElementById('image-upload');
    const uploadImageButton = document.getElementById('upload-image-button');
    const imagePreviewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const clearImageButton = document.getElementById('clear-image-button');
    const typingIndicator = document.getElementById('typing-indicator');

    const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=AIzaSyDKCOPVTAE5ArvAQjW24S5jWpcEd1r5wew';

    let currentImageBase64 = null;
    let currentImageMimeType = null;

    // Function to append messages to the chat
    function appendMessage(sender, text, isImage = false, imageUrl = '') {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', `${sender}-message`);

        const avatarDiv = document.createElement('div');
        avatarDiv.classList.add('avatar', `${sender}-avatar`);
        avatarDiv.textContent = sender === 'user' ? 'U' : 'M'; // 'U' for User, 'M' for Matsanela Ai

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');

        if (isImage && imageUrl) {
            const imgElement = document.createElement('img');
            imgElement.src = imageUrl;
            contentDiv.appendChild(imgElement);
        }

        if (text) {
            const pElement = document.createElement('p');
            pElement.textContent = text;
            contentDiv.appendChild(pElement);
        }

        messageDiv.appendChild(avatarDiv);
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);

        // Auto-scroll to the latest message with a slight delay for animation
        setTimeout(() => {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }, 100);
    }

    // Show/hide typing indicator
    function showTypingIndicator() {
        typingIndicator.classList.add('show');
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to show indicator
    }

    function hideTypingIndicator() {
        typingIndicator.classList.remove('show');
    }

    // Handle sending message
    async function sendMessage() {
        const text = userInput.value.trim();
        if (!text && !currentImageBase64) return; // Don't send empty messages

        // Display user message immediately
        appendMessage('user', text, !!currentImageBase64, currentImageBase64);

        showTypingIndicator(); // Show typing indicator before API call

        const parts = [];
        if (text) {
            parts.push({ text: text });
        }
        if (currentImageBase64 && currentImageMimeType) {
            parts.push({
                inlineData: {
                    mimeType: currentImageMimeType,
                    data: currentImageBase64.split(',')[1] // Get base64 string without data:image/jpeg;base64,
                }
            });
        }

        userInput.value = ''; // Clear input field
        autoResizeTextarea(); // Reset textarea size
        clearImagePreview(); // Clear image preview after sending

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    contents: [{ parts: parts }]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`API Error: ${response.status} - ${errorData.error.message || 'Unknown error'}`);
            }

            const data = await response.json();
            const botResponse = data.candidates[0].content.parts[0].text;
            appendMessage('bot', botResponse);

        } catch (error) {
            console.error('Error sending message:', error);
            appendMessage('bot', `Maaf, terjadi kesalahan: ${error.message}. Silakan coba lagi.`);
        } finally {
            hideTypingIndicator(); // Hide typing indicator after response
        }
    }

    // Auto-resize textarea based on content
    function autoResizeTextarea() {
        userInput.style.height = 'auto';
        userInput.style.height = userInput.scrollHeight + 'px';
    }

    // Handle image upload
    uploadImageButton.addEventListener('click', () => {
        imageUpload.click(); // Trigger hidden file input click
    });

    imageUpload.addEventListener('change', (event) => {
        const file = event.target.files[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                alert('Hanya file gambar yang diizinkan.');
                clearImagePreview();
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                imagePreview.src = e.target.result;
                imagePreviewContainer.style.display = 'block';
                currentImageBase64 = e.target.result;
                currentImageMimeType = file.type;
            };
            reader.readAsDataURL(file);
        } else {
            clearImagePreview();
        }
    });

    // Clear image preview
    clearImageButton.addEventListener('click', () => {
        clearImagePreview();
    });

    function clearImagePreview() {
        imagePreview.src = '';
        imagePreviewContainer.style.display = 'none';
        currentImageBase64 = null;
        currentImageMimeType = null;
        imageUpload.value = ''; // Clear the file input
    }

    // Event listeners
    sendButton.addEventListener('click', sendMessage);

    userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) { // Enter to send, Shift+Enter for new line
            event.preventDefault(); // Prevent default new line
            sendMessage();
        }
    });

    userInput.addEventListener('input', autoResizeTextarea);

    // Initial resize for textarea
    autoResizeTextarea();
});