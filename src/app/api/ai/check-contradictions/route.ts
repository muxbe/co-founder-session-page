import { NextRequest, NextResponse } from 'next/server';
import { generateJSONContent } from '@/features/ai/gemini/client';

export const runtime = 'nodejs';

/**
 * POST /api/ai/check-contradictions
 * Check if current answer contradicts previous answers stored in memory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { current_answer, current_field, memory_summary } = body;

    if (!current_answer || !memory_summary) {
      return NextResponse.json({ has_contradiction: false });
    }

    console.log('[Check Contradictions] Checking for field:', current_field);

    const prompt = `
თქვენ ხართ წინააღმდეგობების დეტექტორი ბიზნეს იდეის შესახებ დიალოგში.

**დავალება:** შეამოწმეთ არის თუ არა წინააღმდეგობა ახლანდელ პასუხსა და წინა პასუხებს შორის.

**მეხსიერებაში შენახული ინფორმაცია:**
${memory_summary}

**ახლანდელი ველი:** ${current_field}

**ახლანდელი პასუხი:**
"${current_answer}"

**რას ეძებთ:**

1. **პირდაპირი წინააღმდეგობები:**
   - მაგალითი: ადრე: "ყველას აქვს ეს პრობლემა", ახლა: "მხოლოდ IT სპეციალისტებს"
   - მაგალითი: ადრე: "უფასო იქნება", ახლა: "თვეში 50 ლარი"

2. **რიცხვითი შეუსაბამობები:**
   - მაგალითი: ადრე: "1000 მომხმარებელი", ახლა: "100 მომხმარებელი"
   - მაგალითი: ადრე: "3 თვეში", ახლა: "1 წელიწადში"

3. **აუდიტორიის შეუთავსებლობა:**
   - მაგალითი: ადრე: "სტუდენტები", ახლა: "მაღალანაზღაურებადი პროფესიონალები"

4. **სტრატეგიული წინააღმდეგობები:**
   - მაგალითი: ადრე: "B2C", ახლა: "ვყიდით კომპანიებს"

**NU IYENOT წინააღმდეგობად:**
- მცირე დეტალების დაზუსტებები
- ბუნებრივი პროგრესია იდეის განვითარებაში
- სხვადასხვა კუთხით ახსნა იმავე რამის

**პასუხის ფორმატი (JSON):**
{
  "has_contradiction": boolean,
  "contradiction_details": {
    "field1": "პირველი ველის სახელი",
    "statement1": "რა თქვა მანამდე",
    "statement2": "რა თქვა ახლა",
    "explanation": "მოკლე ახსნა რატომ არის წინააღმდეგობა"
  },
  "clarification_question": "კითხვა ქართულად რომელიც სთხოვს დაზუსტებას (თუ არის წინააღმდეგობა)"
}

თუ არ არის წინააღმდეგობა:
{
  "has_contradiction": false
}

მხოლოდ JSON დააბრუნეთ, სხვა ტექსტის გარეშე.
`;

    const result = await generateJSONContent<{
      has_contradiction: boolean;
      contradiction_details?: {
        field1: string;
        field2?: string;
        statement1: string;
        statement2: string;
        explanation: string;
      };
      clarification_question?: string;
    }>(prompt);

    console.log('[Check Contradictions] Result:', result);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[Check Contradictions] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
