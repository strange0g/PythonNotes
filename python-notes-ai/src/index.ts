// src/index.ts

// Import the official Google AI SDK
import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Define the environment variables that will be available to the worker.
 * Cloudflare will automatically bind the secret you created to this interface.
 */
export interface Env {
  GEMINI_API_KEY: string;
}

export default {
  /**
   * The main fetch handler for the worker. This is the entry point for all requests.
   * @param request - The incoming HTTP request.
   * @param env - The environment variables, including secrets.
   * @param ctx - The execution context.
   * @returns A Response object.
   */
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    
    // --- CORS Handling ---
    // The browser will send an 'OPTIONS' request first to check if it's allowed to make a POST request.
    // This is called a "preflight" request. We need to handle it.
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // We only want to handle POST requests for our chat API.
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed. Please use POST.', { status: 405 });
    }

    try {
      // --- Request Processing ---
      // Parse the JSON body from the incoming request. We expect a { query: "..." } format.
      const { query } = await request.json<{ query: string }>();

      // Basic validation: ensure the query exists.
      if (!query) {
        return new Response(JSON.stringify({ error: 'Query is a required field.' }), { 
          status: 400,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      // --- Gemini AI Logic ---
      // 1. Initialize the GoogleAI client with the secret API key.
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      
      // 2. Get the specific model we want to use.
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      // 3. Create a prompt. For now, it's a simple instruction.
      // In Phase 3, this prompt will be much more complex and include custom context.
      const prompt = `"${query}"`;
      
      // 4. Call the Gemini API to generate content.
      const result = await model.generateContent(prompt);
      const geminiResponse = result.response;
      const responseText = geminiResponse.text();
      
      // 5. Format the successful response payload.
      const responsePayload = { answer: responseText };

      // --- Send Response ---
      // Return the AI's answer to the frontend.
      return new Response(JSON.stringify(responsePayload), {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders, // Important: Include CORS headers in the actual response too
        },
      });

    } catch (error) {
      // --- Error Handling ---
      console.error("An error occurred:", error);
      const errorPayload = { error: 'An internal server error occurred. Please try again later.' };
      return new Response(JSON.stringify(errorPayload), { 
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

// --- CORS Helper Functions ---
// Define the headers that allow cross-origin requests.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // For development. In production, change this to your website's domain.
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

/**
 * Handles the CORS preflight request.
 * @param request - The incoming OPTIONS request.
 * @returns A Response object with the appropriate CORS headers.
 */
function handleOptions(request: Request) {
  // Check if the request includes the necessary CORS headers.
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    // This is a valid preflight request. Respond with our CORS headers.
    return new Response(null, { headers: corsHeaders });
  } else {
    // This is not a valid preflight request.
    return new Response(null, {
      headers: { Allow: 'POST, OPTIONS' },
    });
  }
}