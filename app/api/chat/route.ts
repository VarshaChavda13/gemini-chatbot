import { GoogleAuth } from 'google-auth-library';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const { userMessage } = await req.json();

  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  const client = await auth.getClient();
  const { token } = await client.getAccessToken(); // ✅ fix here

  const projectId = process.env.GOOGLE_PROJECT_ID!;
  const region = process.env.GOOGLE_REGION!;
  const model = process.env.VERTEX_MODEL_NAME!;
  const prompt = process.env.SYSTEM_PROMPT!;

//   const url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${model}:generateContent`;
const url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent";


  const res = await fetch(url, {
    method: 'POST',
    headers: {
    //   Authorization: `Bearer ${token}`, // ✅ fixed: only pass the string
      'Content-Type': 'application/json',
      "x-goog-api-key": process.env.AI_STUDIO_API_KEY!,

    },
    body: JSON.stringify({
      contents: [
        {
          role: 'user',
          parts: [
            { text: `${prompt}\n\nUser: ${userMessage}` },
          ],
        },
      ],
    }),
  });

  const data = await res.json();
  console.log("Vertex AI response:", JSON.stringify(data, null, 2));

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';
  return NextResponse.json({ response: text });
}
