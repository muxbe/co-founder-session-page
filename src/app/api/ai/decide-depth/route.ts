import { NextRequest, NextResponse } from 'next/server';
import { generateJSONContent } from '@/features/ai/gemini/client';
import { FIELD_COMPLEXITY_MAP, BASE_QUESTION_COUNT } from '@/types/adaptive';
import type { DepthDecisionRequest, DepthDecisionResult, FieldComplexity } from '@/types/adaptive';

export const runtime = 'nodejs';

/**
 * POST /api/ai/decide-depth
 * Decides how many questions to ask for a field (2-7)
 * Based on: user experience, previous answer quality, field complexity
 */
export async function POST(request: NextRequest) {
  try {
    const body: DepthDecisionRequest = await request.json();
    const {
      field_key,
      field_name,
      user_experience,
      previous_field_quality = 'first_field',
      idea_context,
    } = body;

    console.log('[Decide Depth] Processing field:', field_key);

    // Get field complexity
    const complexity: FieldComplexity = FIELD_COMPLEXITY_MAP[field_key] || 'medium';
    const baseCount = BASE_QUESTION_COUNT[complexity];

    // Determine question count using AI
    const prompt = `
თქვენ ხართ ბიზნეს მენტორის ასისტენტი, რომელიც გეხმარებათ განსაზღვროთ რამდენი კითხვა უნდა დასვათ კონკრეტულ თემაზე.

**მომხმარებლის ინფორმაცია:**
- როლი: ${user_experience?.role || 'unknown'}
- ბიზნეს გამოცდილება: ${user_experience?.business_experience || 'unknown'}
- სტარტაპ ცოდნა: ${user_experience?.startup_knowledge || 'beginner'}

**იდეის კონტექსტი:**
${idea_context || 'არ არის მითითებული'}

**თემა რომელზეც ვსაუბრობთ:**
- ველის გასაღები: ${field_key}
- ველის სახელი: ${field_name}
- სირთულე: ${complexity} (low=მარტივი, medium=საშუალო, high=რთული)

**წინა ველების ხარისხი:**
${previous_field_quality === 'first_field' ? 'ეს პირველი ველია' :
  previous_field_quality === 'detailed' ? 'წინა პასუხები ძალიან დეტალური იყო' :
  previous_field_quality === 'adequate' ? 'წინა პასუხები საკმარისი იყო' :
  'წინა პასუხები ბუნდოვანი იყო'}

**დავალება:**
გადაწყვიტეთ რამდენი კითხვა (2-დან 7-მდე) უნდა დაისვას ამ თემაზე.

**წესები:**

1. **გამოცდილების მიხედვით:**
   - expert → ნაკლები კითხვები (base - 2)
   - beginner → მეტი კითხვები (base + 2)
   - intermediate → ნორმალური რაოდენობა

2. **ველის სირთულის მიხედვით:**
   - low complexity → 2-3 კითხვა
   - medium complexity → 3-5 კითხვა
   - high complexity → 5-7 კითხვა

3. **წინა პასუხების ხარისხის მიხედვით:**
   - detailed → ნაკლები კითხვები (base - 1)
   - adequate → ნორმალური
   - vague → მეტი კითხვები (base + 1)

4. **მინიმუმი: 2, მაქსიმუმი: 7**

**ბაზური რაოდენობა ამ სირთულისთვის:** ${baseCount}

**პასუხის ფორმატი (JSON):**
{
  "count": 4,
  "reason": "მომხმარებელი beginner-ია და ველი საშუალო სირთულისაა, ამიტომ 4 კითხვა საკმარისია",
  "complexity": "${complexity}",
  "quality_assessment": "${previous_field_quality}"
}

გამოთვალეთ ოპტიმალური რაოდენობა და დააბრუნეთ მხოლოდ JSON, სხვა ტექსტის გარეშე.
`;

    const result = await generateJSONContent<{
      count: number;
      reason: string;
      complexity: string;
      quality_assessment: string;
    }>(prompt);

    // Ensure count is within bounds (2-7)
    let finalCount = Math.max(2, Math.min(7, result.count || baseCount));

    console.log(`[Decide Depth] Field: ${field_key}, Complexity: ${complexity}, Count: ${finalCount}, Reason: ${result.reason}`);

    const response: DepthDecisionResult = {
      count: finalCount,
      reason: result.reason || `${finalCount} კითხვა ამ თემაზე`,
      complexity,
      quality_assessment: previous_field_quality,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[Decide Depth] Error:', error);

    // Fallback to medium complexity on error
    const fallbackComplexity: FieldComplexity = 'medium';
    const fallbackCount = BASE_QUESTION_COUNT[fallbackComplexity];

    return NextResponse.json({
      count: fallbackCount,
      reason: 'ავტომატური განსაზღვრა',
      complexity: fallbackComplexity,
      quality_assessment: 'first_field',
    });
  }
}
