import { GoogleGenAI } from '@google/genai';
import { error } from 'console';
import { NextResponse } from 'next/server';

const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({apiKey});

export async function POST(request: Request){
    try{
        if(!process.env.GEMINI_API_KEY){
            return NextResponse.json({error: 'GEMINI_API_KEY is missing. '},{status: 400});
        }

        const { targetRole, rawInput} = await request.json();

        if(!targetRole || !rawInput){
            return NextResponse.json({error: 'Missing required field'}, {status: 400});
        }

        const systemInstruction = `
            You are an expert technical recruiter specializing in entry-level university hiring. 
            Your task is to transform a student's unstructured description of a project, GitHub repo, or course assignment into exactly 3-4 professional, high-impact resume bullet points.
            
            CRITICAL RULES:
            1. Start every single bullet point with a diverse, strong action verb (e.g., Engineered, Optimized, Architected, Implemented). Do not repeat verbs.
            2. Use the STAR/XYZ formula: "Accomplished [X] as measured by [Y], by doing [Z]".
            3. Realistically estimate performance metrics based on standard engineering practices (e.g., API latency reduction, UI loading speeds, localized data compression) since freshers lack real production data.
            4. Explicitly mention programming languages, frameworks, and developer tools used.
            5. Output ONLY the raw bullet points. Do not include introductory text, conversational fluff, or symbols like markdown asterisks.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Target Job Profile: ${targetRole}\nStudent's Raw Project Text: ${rawInput}`,
            config: {
                systemInstruction: systemInstruction,
                temperature: 0.3,
            }
        });

        const resultText = response.text;

        if(!resultText){
            return NextResponse.json({error: 'Gemini API returned an empty text response.'},{status: 500});
        }

        const bulletPoints = resultText.split('\n').map(bullet => bullet.replace(/^-\s*/,'').trim()).filter(bullet => bullet.length > 0);
        return NextResponse.json({ bullets: bulletPoints});
    }catch (error: any) {
    console.error('Detailed Gemini API Route Error:', error);
    
    // Check if Google's servers are overloaded (503)
    if (error?.status === 503 || error?.message?.includes('503')) {
      return NextResponse.json(
        { error: 'Google AI servers are currently overloaded. Please wait 10 seconds and try again!' },
        { status: 503 }
      );
    }

    // Default error response to prevent Next.js from returning 'undefined'
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error processing AI models.' }, 
      { status: 500 }
    );
  }

}