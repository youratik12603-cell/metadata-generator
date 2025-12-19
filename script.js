// ========== API Configuration ==========
// ⚠️ এখানে তোমার API Keys বসাও
const API_KEYS = {
    gemini: 'YOUR_GEMINI_API_KEY',      // Google AI Studio থেকে নাও
    groq: 'YOUR_GROQ_API_KEY',          // Groq Console থেকে নাও
    openai: 'YOUR_OPENAI_API_KEY'       // OpenAI থেকে নাও
};

// API Endpoints
const API_ENDPOINTS = {
    gemini: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
    groq: 'https://api.groq.com/openai/v1/chat/completions',
    openai: 'https://api.openai.com/v1/chat/completions'
};

// ========== DOM Elements ==========
const topicInput = document.getElementById('topic');
const keywordsInput = document.getElementById('keywords');
const languageSelect = document.getElementById('language');
const aiProviderSelect = document.getElementById('aiProvider');
const generateBtn = document.getElementById('generateBtn');
const loadingDiv = document.getElementById('loading');
const errorDiv = document.getElementById('error');
const outputSection = document.getElementById('outputSection');

// Output Elements
const seoTitleDiv = document.getElementById('seoTitle');
const metaDescDiv = document.getElementById('metaDesc');
const metaKeywordsDiv = document.getElementById('metaKeywords');
const htmlCodePre = document.getElementById('htmlCode');

// ========== Main Generate Function ==========
generateBtn.addEventListener('click', async () => {
    // Validation
    const topic = topicInput.value.trim();
    if (!topic) {
        showError('দয়া করে Topic লিখো!');
        return;
    }

    const keywords = keywordsInput.value.trim();
    const language = languageSelect.value;
    const provider = aiProviderSelect.value;

    // Check API Key
    if (API_KEYS[provider] === `YOUR_${provider.toUpperCase()}_API_KEY` || !API_KEYS[provider]) {
        showError(`${provider.toUpperCase()} API Key সেট করোনি! script.js ফাইলে API Key বসাও।`);
        return;
    }

    // Show Loading
    showLoading(true);
    hideError();
    outputSection.classList.add('hidden');

    try {
        // Create Prompt
        const prompt = createPrompt(topic, keywords, language);
        
        // Call AI API
        let result;
        if (provider === 'gemini') {
            result = await callGemini(prompt);
        } else if (provider === 'groq') {
            result = await callGroq(prompt);
        } else {
            result = await callOpenAI(prompt);
        }

        // Parse and Display Result
        displayResult(result);

    } catch (error) {
        console.error('Error:', error);
        showError('কিছু সমস্যা হয়েছে: ' + error.message);
    } finally {
        showLoading(false);
    }
});

// ========== Create Prompt ==========
function createPrompt(topic, keywords, language) {
    let langInstruction = '';
    if (language === 'bangla') {
        langInstruction = 'Write everything in Bengali language.';
    } else if (language === 'hinglish') {
        langInstruction = 'Write in Hinglish (Hindi + English mix).';
    } else {
        langInstruction = 'Write in English.';
    }

    return `You are an expert SEO specialist. Generate optimized metadata for a webpage.

Topic: ${topic}
${keywords ? `Focus Keywords: ${keywords}` : ''}
${langInstruction}

Generate the following in JSON format ONLY (no extra text):
{
    "seoTitle": "SEO optimized title (max 60 characters)",
    "metaDescription": "Compelling meta description (max 160 characters)",
    "metaKeywords": "comma separated keywords (5-8 keywords)"
}

Important:
- Make title catchy and include main keyword
- Description should be compelling and actionable
- Keywords should be relevant and varied
- Follow character limits strictly
- Return ONLY valid JSON, no markdown, no explanation`;
}

// ========== API Call Functions ==========

// Google Gemini API
async function callGemini(prompt) {
    const response = await fetch(`${API_ENDPOINTS.gemini}?key=${API_KEYS.gemini}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 500
            }
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Gemini API Error');
    }

    const data = await response.json();
    const text = data.candidates[0].content.parts[0].text;
    return parseJSON(text);
}

// Groq API
async function callGroq(prompt) {
    const response = await fetch(API_ENDPOINTS.groq, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEYS.groq}`
        },
        body: JSON.stringify({
            model: 'llama-3.1-8b-instant',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Groq API Error');
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    return parseJSON(text);
}

// OpenAI API
async function callOpenAI(prompt) {
    const response = await fetch(API_ENDPOINTS.openai, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEYS.openai}`
        },
        body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: prompt
            }],
            temperature: 0.7,
            max_tokens: 500
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API Error');
    }

    const data = await response.json();
    const text = data.choices[0].message.content;
    return parseJSON(text);
}

// ========== Helper Functions ==========

// Parse JSON from AI response
function parseJSON(text) {
    // Clean the response
    let cleanText = text.trim();
    
    // Remove markdown code blocks if present
    cleanText = cleanText.replace(/```json\n?/g, '');
    cleanText = cleanText.replace(/```\n?/g, '');
    cleanText = cleanText.trim();

    try {
        return JSON.parse(cleanText);
    } catch (e) {
        // Try to extract JSON from text
        const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
        throw new Error('AI response parse করতে সমস্যা হয়েছে');
    }
}

// Display Result
function displayResult(result) {
    seoTitleDiv.textContent = result.seoTitle || '';
    metaDescDiv.textContent = result.metaDescription || '';
    metaKeywordsDiv.textContent = result.metaKeywords || '';

    // Generate HTML Code
    const htmlCode = `<!-- SEO Meta Tags -->
<title>${result.seoTitle || ''}</title>
<meta name="description" content="${result.metaDescription || ''}">
<meta name="keywords" content="${result.metaKeywords || ''}">

<!-- Open Graph / Facebook -->
<meta property="og:title" content="${result.seoTitle || ''}">
<meta property="og:description" content="${result.metaDescription || ''}">
<meta property="og:type" content="website">

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${result.seoTitle || ''}">
<meta name="twitter:description" content="${result.metaDescription || ''}">`;

    htmlCodePre.textContent = htmlCode;

    // Show output section
    outputSection.classList.remove('hidden');
    
    // Scroll to output
    outputSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// Show/Hide Loading
function showLoading(show) {
    if (show) {
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.textContent = 'Generating...';
    } else {
        loadingDiv.classList.add('hidden');
        generateBtn.disabled = false;
        generateBtn.textContent = '✨ Generate Metadata';
    }
}

// Show Error
function showError(message) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
}

// Hide Error
function hideError() {
    errorDiv.classList.add('hidden');
}

// ========== Copy Functionality ==========
document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target');
        const targetElement = document.getElementById(targetId);
        const textToCopy = targetElement.textContent;

        navigator.clipboard.writeText(textToCopy).then(() => {
            // Show copied feedback
            const originalText = btn.textContent;
            btn.textContent = 'Copied! ✓';
            btn.classList.add('copied');
            
            setTimeout(() => {
                btn.textContent = originalText;
                btn.classList.remove('copied');
            }, 2000);
        }).catch(err => {
            console.error('Copy failed:', err);
        });
    });
});