import { NextRequest, NextResponse } from 'next/server';
import { generateJSONContent } from '@/features/ai/gemini/client';

export const runtime = 'nodejs';

/**
 * POST /api/ai/extract-entities
 * Extract mentioned entities from user's answer for memory tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { answer, field_key, idea_context } = body;

    if (!answer) {
      return NextResponse.json(
        { error: 'Answer is required' },
        { status: 400 }
      );
    }

    console.log('[Extract Entities] Processing answer for field:', field_key);

    const prompt = `
თქვენ ხართ ენტიტების ამოღების სისტემა ქართულ ბიზნეს დიალოგებისთვის.

**დავალება:** ამოიღეთ მნიშვნელოვანი ენტიტები მომხმარებლის პასუხიდან.

**იდეის კონტექსტი:** ${idea_context || 'არ არის მითითებული'}

**ველი:** ${field_key}

**მომხმარებლის პასუხი:**
"${answer}"

**ამოსაღები ენტიტების კატეგორიები:**

1. **audiences** - აუდიტორია/მომხმარებლის სეგმენტები
   მაგალითები: "სტუდენტები", "SMB ბიზნესები", "IT სპეციალისტები", "30-40 წლის ქალები"

2. **competitors** - კონკურენტები/ალტერნატივები
   მაგალითები: "ChatGPT", "Notion", "Google Docs", "Excel"

3. **features** - ფუნქციები/შესაძლებლობები
   მაგალითები: "AI chat", "PDF export", "real-time collaboration", "dark mode"

4. **numbers** - რიცხვები (ფასები, რაოდენობები, პროცენტები, დრო)
   მაგალითები: "500 ლარი", "1000 მომხმარებელი", "3 თვე", "20%", "50 ადამიანი"

5. **locations** - ლოკაციები/ბაზრები
   მაგალითები: "თბილისი", "საქართველო", "ევროპა", "აღმოსავლეთ ევროპა"

**წესები:**
- ამოიღეთ მხოლოდ კონკრეტულად ნახსენები ენტიტები
- ნუ გამოიგონებთ ან დაამატებთ ენტიტებს
- დააბრუნეთ ცარიელი მასივი თუ არ იპოვეთ ენტიტეები კატეგორიაში
- გამოიყენეთ ზუსტად ისე როგორც მომხმარებელმა მოიხსენია
- თითოეულ კატეგორიაში max 5 ენტიტი

**პასუხის ფორმატი (JSON):**
{
  "audiences": ["string array"],
  "competitors": ["string array"],
  "features": ["string array"],
  "numbers": ["string array"],
  "locations": ["string array"]
}

მხოლოდ JSON დააბრუნეთ, სხვა ტექსტის გარეშე.
`;

    const entities = await generateJSONContent<{
      audiences: string[];
      competitors: string[];
      features: string[];
      numbers: string[];
      locations: string[];
    }>(prompt);

    console.log('[Extract Entities] Extracted:', entities);

    return NextResponse.json(entities);
  } catch (error) {
    console.error('[Extract Entities] Error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
