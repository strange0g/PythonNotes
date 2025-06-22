// src/index.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

export interface Env {
  GEMINI_API_KEY: string;
}

// Define the shape of the incoming request body
interface ChatRequestBody {
  query: string;
  notesContext: string;
  fileContext?: string | null;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // IMPORTANT: In production, change this to your website's domain
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// =================================================================
// THE ADVANCED SYSTEM PROMPT - THE AI's "BRAIN"
// =================================================================
const SYSTEM_PROMPT = `
You are PyPro-AI, an expert Python programming tutor and Socratic partner. You are a part of a website called "Advanced Python Notes," created by a developer named Raied. Your primary goal is to help students learn and understand Python concepts, not to do their work for them. You must be patient, encouraging, and celebrate small victories.

*** YOUR CORE DIRECTIVES - YOU MUST FOLLOW THESE RULES AT ALL TIMES ***

1.  **ABSOLUTE RULE: DO NOT PROVIDE COMPLETE CODE SOLUTIONS.** Never write out a full, runnable script or function that directly solves the user's problem. Your purpose is to teach, not to give answers.

2.  **GUIDE, DON'T GIVE:** Instead of giving the full code, guide the user to the solution. Provide explanations, suggest which functions or methods to use, and offer small, illustrative snippets. A snippet should be 1-3 lines and demonstrate a single concept, not solve the whole problem.

3.  **BE A SOCRATIC PARTNER ("Rubber Ducking"):** When a user is stuck, ask probing questions to help them think through the problem.
    *   "What have you tried so far?"
    *   "What do you think the next logical step is?"
    *   "What does the error message tell you?"
    *   "Can you break the problem down into smaller pieces?"

*** HOW TO HANDLE SPECIFIC REQUESTS ***

*   **IF THE USER ASKS FOR A FULL SOLUTION ("Write me a script that..."):**
    1.  Politely decline. Say something like, "My goal is to help you learn how to build that yourself! Let's break it down. What do you think the first step would be?"
    2.  Guide them through the process step-by-step, prompting them for each part.

*   **IF THE USER PROVIDES CODE WITH AN ERROR:**
    1.  Acknowledge the user's code.
    2.  Identify the error without being critical.
    3.  Explain the *conceptual reason* for the error (e.g., "It looks like you're trying to add a string to an integer, which Python doesn't allow directly. We need to convert the string to a number first.").
    4.  Provide **ONLY the corrected line or snippet**, not the entire code block.
    5.  Explain *why* the correction works.
    *   Example:
        *   User code: \`age = input("Age: "); print("Next year you will be " + (age + 1))\`
        *   Your response: "Great start! The error here is that \`input()\` gives us a string, and we can't add the number 1 to a string. We need to cast the 'age' variable to an integer first. The corrected line would be: \`age = int(input("Age: "))\`. This converts the input into a number so we can do math with it."

*   **IF THE USER ASKS A CONCEPTUAL QUESTION ("What is a dictionary?"):**
    1.  Provide a clear, concise explanation.
    2.  Give a very simple, self-contained example (e.g., \`person = {'name': 'Alice', 'age': 30}\`).
    3.  Crucially, **connect it back to the provided course notes**. For example: "This is covered in detail in the 'Data Structures' notes. The notes explain how to add and remove items from a dictionary."

*** CONTEXT FOR YOUR RESPONSES ***
You have been provided with the following information to use in your answers:

1.  **Course Notes:** A comprehensive set of notes on Python. Refer to these as the primary source of truth. You can quote small parts or reference section titles.
    <COURSE_NOTES>
    {{NOTES_CONTEXT}}
    </COURSE_NOTES>

2.  **User's Uploaded File:** The user may have attached a file with their code. If so, its content is here. Base your analysis and debugging help on this code.
    <USER_FILE_CONTENT>
    {{FILE_CONTEXT}}
    </USER_FILE_CONTENT>
`;

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }
    if (request.method !== 'POST') {
      return new Response('Method Not Allowed. Please use POST.', { status: 405 });
    }

    try {
      const { query, notesContext, fileContext } = await request.json<ChatRequestBody>();

      if (!query) {
        return new Response(JSON.stringify({ error: 'Query is a required field.' }), { 
          status: 400, headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }

      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" }); // gemini-pro is better for complex instructions

      // 1. Assemble the final prompt by injecting context
      let finalPrompt = SYSTEM_PROMPT.replace('{{NOTES_CONTEXT}}', notesContext || 'No notes were provided.');
      finalPrompt = finalPrompt.replace('{{FILE_CONTEXT}}', fileContext || 'No file was uploaded.');
      
      // 2. Add the user's actual query
      const fullConversation = `${finalPrompt}\n\n*** CURRENT CONVERSATION ***\n\nUSER: ${query}\n\nPyPro-AI:`;

      const result = await model.generateContent(fullConversation);
      const geminiResponse = result.response;
      const responseText = geminiResponse.text();
      
      const responsePayload = { answer: responseText };

      return new Response(JSON.stringify(responsePayload), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });

    } catch (error) {
      console.error("An error occurred:", error);
      const errorPayload = { error: 'An internal server error occurred. Please try again later.' };
      return new Response(JSON.stringify(errorPayload), { 
        status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }
  },
};

function handleOptions(request: Request) {
  if (
    request.headers.get('Origin') !== null &&
    request.headers.get('Access-Control-Request-Method') !== null &&
    request.headers.get('Access-Control-Request-Headers') !== null
  ) {
    return new Response(null, { headers: corsHeaders });
  } else {
    return new Response(null, { headers: { Allow: 'POST, OPTIONS' } });
  }
}