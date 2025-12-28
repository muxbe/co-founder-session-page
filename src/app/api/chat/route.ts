import { NextRequest, NextResponse } from 'next/server';
import {
  GoogleGenerativeAI,
  Content,
  FunctionCall,
  FunctionCallingMode,
} from '@google/generative-ai';
import { toolDefinitions } from '@/features/ai/tools';
import { SYSTEM_PROMPT } from '@/features/ai/prompts/system';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

// Type definitions for function call arguments
interface NextTopicArgs {
  field_key: string;
  field_name: string;
  field_icon: string;
  question: string;
}

interface CompleteTopicArgs {
  content: string;
  next_topic?: NextTopicArgs;
}

interface StartTopicArgs {
  field_key: string;
}

// Lazy initialization
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing GEMINI_API_KEY');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * POST /api/chat
 * New simplified chat endpoint for 4-tool architecture
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { history, message, completedFields = [], sessionId } = body;

    console.log('[API/chat] Request:', {
      historyLength: history?.length || 0,
      messagePreview: message?.substring(0, 50),
      completedFields,
      sessionId,
    });

    // Build context with completed fields info
    let contextInfo = SYSTEM_PROMPT;
    if (completedFields && completedFields.length > 0) {
      contextInfo += `\n\n⚠️ ALREADY COMPLETED FIELDS (DO NOT USE THESE AGAIN):\n${completedFields.join(', ')}\n\nYou MUST choose a DIFFERENT field_key for next_topic! Never repeat a completed field.`;
    }

    // Build full history with system prompt
    const fullHistory: Content[] = [
      { role: 'user', parts: [{ text: contextInfo }] },
      { role: 'model', parts: [{ text: 'გასაგებია. მზად ვარ დასახმარებლად.' }] },
      ...(history || []),
    ];

    // Create model with tools - FORCE tool usage
    const model = getGenAI().getGenerativeModel({
      model: 'gemini-2.0-flash',
      generationConfig: {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
      tools: [{ functionDeclarations: toolDefinitions }],
      toolConfig: {
        functionCallingConfig: {
          mode: FunctionCallingMode.ANY, // Force the model to ALWAYS call a function
        },
      },
    });

    // Start chat
    const chat = model.startChat({
      history: fullHistory.filter(h => h.parts && h.parts.length > 0),
    });

    // Send message
    const result = await chat.sendMessage(message);
    const response = result.response;

    // Extract function calls
    const functionCalls: FunctionCall[] = [];
    let text = '';

    const parts = response.candidates?.[0]?.content?.parts || [];
    for (const part of parts) {
      if ('functionCall' in part && part.functionCall) {
        console.log('[API/chat] Function call:', part.functionCall.name);

        // Log and FIX complete_topic if it uses a completed field
        if (part.functionCall.name === 'complete_topic') {
          console.log('[API/chat] complete_topic args:', JSON.stringify(part.functionCall.args, null, 2));

          const args = part.functionCall.args as CompleteTopicArgs;
          const nextTopic = args?.next_topic;
          if (nextTopic && completedFields.includes(nextTopic.field_key)) {
            console.log('[API/chat] ⚠️ AI tried to use completed field:', nextTopic.field_key);

            // Find next available field
            const allFields = [
              'problem', 'solution', 'target_users', 'value_proposition',
              'competition', 'revenue_model', 'mvp_features', 'risks',
              'metrics', 'market_size', 'pricing', 'distribution',
              'team', 'funding', 'timeline', 'technology', 'legal',
              'partnerships', 'growth'
            ];
            const availableFields = allFields.filter(f => !completedFields.includes(f));

            if (availableFields.length > 0) {
              // Pick next available field
              const nextField = availableFields[0];
              console.log('[API/chat] 🔧 Auto-selecting next available field:', nextField);

              // Georgian field names mapping
              const fieldNames: Record<string, string> = {
                problem: 'პრობლემა', solution: 'გადაწყვეტა', target_users: 'სამიზნე აუდიტორია',
                value_proposition: 'უნიკალური ღირებულება', competition: 'კონკურენცია',
                revenue_model: 'შემოსავლის მოდელი', mvp_features: 'MVP', risks: 'რისკები',
                metrics: 'მეტრიკები', market_size: 'ბაზრის ზომა', pricing: 'ფასი',
                distribution: 'გავრცელება', team: 'გუნდი', funding: 'დაფინანსება',
                timeline: 'ვადები', technology: 'ტექნოლოგია', legal: 'სამართლებრივი',
                partnerships: 'პარტნიორობა', growth: 'ზრდა'
              };
              const fieldIcons: Record<string, string> = {
                problem: '❓', solution: '💡', target_users: '🎯', value_proposition: '✨',
                competition: '⚔️', revenue_model: '💰', mvp_features: '🚀', risks: '⚠️',
                metrics: '📊', market_size: '📈', pricing: '💵', distribution: '🚚',
                team: '👥', funding: '🏦', timeline: '📅', technology: '💻',
                legal: '⚖️', partnerships: '🤝', growth: '📈'
              };

              nextTopic.field_key = nextField;
              nextTopic.field_name = fieldNames[nextField] || nextField;
              nextTopic.field_icon = fieldIcons[nextField] || '📝';
              nextTopic.question = `🤖 Cofounder\n\nმოდი ახლა ${fieldNames[nextField] || nextField}-ზე ვისაუბროთ. მიამბე მეტი ამის შესახებ.`;
            } else {
              console.log('[API/chat] 🔧 No more fields available, removing next_topic');
              delete args.next_topic;
            }
          }

          console.log('[API/chat] Has next_topic:', !!args?.next_topic);

          // Save completed field to passport_fields database
          if (sessionId && args?.content) {
            const supabase = createClient();

            // The field being completed is the FIRST field NOT in completedFields
            const allFieldsOrder = [
              'idea', 'problem', 'solution', 'target_users', 'value_proposition',
              'competition', 'revenue_model', 'mvp_features', 'risks', 'metrics',
              'business_model', 'market_size', 'pricing', 'distribution', 'team'
            ];
            const currentFieldKey = allFieldsOrder.find(f => !completedFields.includes(f)) || 'unknown';

            // Get field display info
            const fieldNames: Record<string, string> = {
              idea: 'იდეა', problem: 'პრობლემა', solution: 'გადაწყვეტა', target_users: 'სამიზნე აუდიტორია',
              value_proposition: 'უნიკალური ღირებულება', competition: 'კონკურენცია',
              revenue_model: 'შემოსავლის მოდელი', mvp_features: 'MVP', risks: 'რისკები',
              metrics: 'მეტრიკები', business_model: 'ბიზნეს მოდელი'
            };

            console.log('[API/chat] Saving passport_field for:', currentFieldKey);

            try {
              // Check if field already exists
              const { data: existing } = await supabase
                .from('passport_fields')
                .select('id')
                .eq('session_id', sessionId)
                .eq('field_key', currentFieldKey)
                .single();

              if (existing) {
                // Update existing field
                await supabase
                  .from('passport_fields')
                  .update({
                    content: args.content,
                    status: 'completed',
                    updated_at: new Date().toISOString(),
                  })
                  .eq('id', existing.id);
                console.log('[API/chat] Updated passport_field:', currentFieldKey);
              } else {
                // Insert new field
                await supabase
                  .from('passport_fields')
                  .insert({
                    session_id: sessionId,
                    field_key: currentFieldKey,
                    question: fieldNames[currentFieldKey] || currentFieldKey,
                    content: args.content,
                    status: 'completed',
                    order_index: completedFields.length,
                  });
                console.log('[API/chat] Saved new passport_field:', currentFieldKey);
              }
            } catch (dbError) {
              console.error('[API/chat] Error saving passport_field:', dbError);
            }
          }
        }

        // Also check start_topic for duplicate fields
        if (part.functionCall.name === 'start_topic') {
          const startArgs = part.functionCall.args as StartTopicArgs;
          const fieldKey = startArgs?.field_key;
          if (fieldKey && completedFields.includes(fieldKey)) {
            console.log('[API/chat] ⚠️ AI tried to start completed field:', fieldKey);
            console.log('[API/chat] 🔧 Skipping duplicate start_topic');
            continue; // Skip this function call entirely
          }
        }

        functionCalls.push(part.functionCall);
      }
      if ('text' in part && part.text) {
        text += part.text;
      }
    }

    console.log('[API/chat] Response:', {
      hasText: !!text,
      functionCallsCount: functionCalls.length,
      functionNames: functionCalls.map(fc => fc.name),
    });

    return NextResponse.json({
      text: text || undefined,
      functionCalls: functionCalls.length > 0 ? functionCalls : undefined,
    });

  } catch (error) {
    console.error('[API/chat] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
