export const config = {
  runtime: 'edge', // Using edge runtime for faster execution
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Read the body from the request
    const { prompt } = await req.json();

    // Securely access the API key from the server environment
    // Note: It is no longer prefixed with VITE_, so it is NEVER exposed to the frontend.
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE') {
      return new Response(JSON.stringify({ 
        brief: "[Mock] Secure Backend Active. No real API key provided to server." 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ping Google from the secure Vercel backend
    const googleResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    });

    const data = await googleResponse.json();

    if (!googleResponse.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Google API Error' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const brief = data.candidates[0].content.parts[0].text;

    return new Response(JSON.stringify({ brief }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Serverless Function Error:", error);
    return new Response(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
