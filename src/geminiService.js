// Gemini API Service
// Centralized module for all Gemini API calls

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent";

console.log('Gemini Service initialized');
console.log('API Key loaded:', !!GEMINI_API_KEY);
console.log('API Key value (first 20 chars):', GEMINI_API_KEY ? GEMINI_API_KEY.substring(0, 20) + '...' : 'NOT SET');
console.log('Using model: gemini-2.0-flash (v1 stable API)');

if (!GEMINI_API_KEY) {
  console.error('⚠️ VITE_GEMINI_API_KEY environment variable is NOT SET! AI features will not work.');
}

/**
 * Generate a learning roadmap for a goal
 * @param {string} goalTitle - The learning goal title
 * @param {string} country - User's country for context
 * @returns {Promise<Array>} Array of roadmap steps
 */
export const generateRoadmap = async (goalTitle, country) => {
  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `You are an educational AI helping students in ${country}. Create a detailed learning roadmap for: "${goalTitle}".

Generate EXACTLY 5 learning steps as a JSON array. Each step should include:
- title: Clear, concise step name (max 6 words)
- description: Brief explanation (1-2 sentences)
- resources: Array of 3 specific FREE online resources with exact names

Consider ${country}'s educational context and curriculum alignment.

Respond ONLY with valid JSON, no markdown, no preamble:
[{"title":"...","description":"...","resources":["...","...","..."]}, ...]`
          }]
        }]
      })
    });

    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      throw new Error('Invalid response structure from Gemini API');
    }

    let roadmapText = data.candidates[0].content.parts[0].text.trim();
    roadmapText = roadmapText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    const generatedRoadmap = JSON.parse(roadmapText);
    
    const formattedRoadmap = generatedRoadmap.map((step, index) => ({
      id: index + 1,
      title: step.title,
      description: step.description,
      completed: false,
      resources: step.resources || []
    }));

    return formattedRoadmap;
  } catch (error) {
    console.error('Error generating roadmap with Gemini API:', error);
    throw error;
  }
};

/**
 * Send a message to the AI tutor
 * @param {string} userMessage - User's message
 * @param {Array} conversationHistory - Array of previous messages
 * @param {Object} userProfile - User profile object with educationLevel, grade, country
 * @param {string} currentGoalTitle - Current learning goal title (optional)
 * @returns {Promise<string>} AI tutor's response
 */
export const getTutorResponse = async (
  userMessage, 
  conversationHistory = [], 
  userProfile = {}, 
  currentGoalTitle = null
) => {
  console.log('📨 getTutorResponse called');
  console.log('User message:', userMessage);
  console.log('API Key present:', !!GEMINI_API_KEY);
  
  if (!GEMINI_API_KEY) {
    throw new Error('Gemini API key is not configured. Please add VITE_GEMINI_API_KEY to .env.local');
  }

  try {
    const conversationContent = conversationHistory.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const requestBody = {
      contents: [
        ...conversationContent,
        {
          role: "user",
          parts: [{
            text: `You are an AI tutor helping a ${userProfile.educationLevel || 'Secondary School'} student (${userProfile.grade || 'Form 5'}) from ${userProfile.country || 'Malaysia'}${currentGoalTitle ? ` learning about "${currentGoalTitle}"` : ''}. 

Student's question: ${userMessage}

IMPORTANT FORMATTING RULES:
- Use clear, well-organized sections with headers
- Break content into short paragraphs (2-3 sentences max)
- Use numbered lists for steps or sequences
- Use bullet points for key concepts
- Use ✓, →, • symbols for emphasis where helpful
- Avoid excessive asterisks or special characters
- Use markdown formatting naturally (** for bold, not ****)
- For practice questions: clearly number each question
- Add emojis sparingly only at section headers (e.g., 📝 Practice Questions)
- Provide CLEAR LINE BREAKS between sections
- Make it easy to scan and read on mobile devices
- Use simple, conversational language

Provide a helpful, clear explanation appropriate for ${userProfile.educationLevel || 'Secondary School'} level using examples relevant to ${userProfile.country || 'Malaysia'} culture and education system. 

When giving practice questions:
- Number them clearly (1), (2), (3)
- Put the question on its own line
- Add a blank line between questions
- Be encouraging and positive

Be encouraging and educational. Keep responses concise but thorough. Format for easy reading on a phone screen.`
          }]
        }
      ]
    };

    console.log('📡 Sending request to Gemini API...');
    console.log('Endpoint:', `${GEMINI_API_URL}?key=${GEMINI_API_KEY.substring(0, 10)}...`);
    
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody)
    });

    console.log('✅ Response received with status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ API Error Response:', errorText);
      throw new Error(`API Error ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    
    console.log('📦 Response data structure:', {
      hasCandidates: !!data.candidates,
      candidatesLength: data.candidates?.length,
      firstCandidateHasContent: !!data.candidates?.[0]?.content,
      hasText: !!data.candidates?.[0]?.content?.parts?.[0]?.text
    });

    if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
      console.error('❌ Invalid response structure:', JSON.stringify(data, null, 2));
      throw new Error('Invalid response structure from Gemini API - no candidates returned');
    }

    const responseText = data.candidates[0].content.parts[0].text;
    console.log('✅ AI Response received:', responseText.substring(0, 100) + '...');
    
    return responseText;
  } catch (error) {
    console.error('❌ Error in getTutorResponse:', error);
    console.error('Error stack:', error.stack);
    throw error;
  }
};

export default {
  generateRoadmap,
  getTutorResponse,
  isConfigured: !!GEMINI_API_KEY
};
