import { GarmentRequirementSchema } from '@tailorconnect/validation';
import { z } from 'zod';

export class AIMatchingService {
  async extractRequirements(promptText: string): Promise<z.infer<typeof GarmentRequirementSchema>> {
    if (!promptText || promptText.trim().length === 0) {
      return GarmentRequirementSchema.parse({
        garmentType: 'Custom Garment',
        category: 'General',
        fabricProvidedByCustomer: true,
        urgency: 'normal',
      });
    }

    // Try real Google Gemini API if GEMINI_API_KEY is configured
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        const geminiResult = await this.callGeminiAPI(promptText, apiKey);
        if (geminiResult) return geminiResult;
      } catch (err) {
        console.warn('[AIMatchingService] Gemini API call failed, falling back to local NLP engine:', err);
      }
    }

    try {
      // Deterministic NLP extraction engine fallback
      const text = promptText.toLowerCase();

      // 1. Detect Garment Type
      let garmentType = 'Custom Garment';
      let category = 'Women\'s Wear';

      if (text.includes('bridal blouse') || (text.includes('blouse') && text.includes('bridal'))) {
        garmentType = 'Bridal Blouse';
        category = 'Bridal';
      } else if (text.includes('blouse')) {
        garmentType = 'Blouse';
        category = "Women's Wear";
      } else if (text.includes('lehenga') || text.includes('choli')) {
        garmentType = 'Lehenga & Choli';
        category = text.includes('bridal') ? 'Bridal' : "Women's Wear";
      } else if (text.includes('kurti') || text.includes('anarkali') || text.includes('salwar')) {
        garmentType = text.includes('anarkali') ? 'Anarkali Suit' : 'Kurti / Salwar Suit';
        category = "Women's Wear";
      } else if (text.includes('sherwani')) {
        garmentType = 'Wedding Sherwani';
        category = "Men's Wear";
      } else if (text.includes('suit') || text.includes('tuxedo') || text.includes('blazer')) {
        garmentType = 'Bespoke Suit';
        category = "Men's Wear";
      } else if (text.includes('shirt')) {
        garmentType = 'Custom Shirt';
        category = "Men's Wear";
      } else if (text.includes('trouser') || text.includes('pant')) {
        garmentType = 'Formal Trousers';
        category = "Men's Wear";
      } else if (text.includes('gown') || text.includes('dress')) {
        garmentType = 'Evening Gown';
        category = "Women's Wear";
      }

      // 2. Detect Occasion
      let occasion: string | undefined;
      if (text.includes('wedding') || text.includes('marriage')) occasion = 'wedding';
      else if (text.includes('reception')) occasion = 'reception';
      else if (text.includes('sangeet')) occasion = 'sangeet';
      else if (text.includes('festival') || text.includes('festive') || text.includes('diwali') || text.includes('eid')) occasion = 'festive';
      else if (text.includes('party')) occasion = 'party';
      else if (text.includes('office') || text.includes('corporate') || text.includes('work')) occasion = 'corporate';

      // 3. Detect Sleeve Style
      let sleeveStyle: string | undefined;
      if (text.includes('elbow') || text.includes('half sleeve')) sleeveStyle = 'elbow';
      else if (text.includes('sleeveless')) sleeveStyle = 'sleeveless';
      else if (text.includes('full sleeve')) sleeveStyle = 'full';
      else if (text.includes('cap sleeve')) sleeveStyle = 'cap';
      else if (text.includes('3/4') || text.includes('three fourth')) sleeveStyle = '3/4th';

      // 4. Detect Neckline
      let necklineStyle: string | undefined;
      if (text.includes('boat neck')) necklineStyle = 'boat neck';
      else if (text.includes('sweetheart')) necklineStyle = 'sweetheart';
      else if (text.includes('deep neck') || text.includes('deep back')) necklineStyle = 'deep neck';
      else if (text.includes('collar') || text.includes('chinese collar')) necklineStyle = 'collar';
      else if (text.includes('square neck')) necklineStyle = 'square neck';
      else if (text.includes('v neck') || text.includes('v-neck')) necklineStyle = 'v-neck';

      // 5. Embroidery & Handwork
      const embroidery = text.includes('embroidery') || text.includes('zardosi') || text.includes('maggam') || text.includes('aari') || text.includes('sequin') || text.includes('handwork');

      // 6. Fabric status
      const fabricProvidedByCustomer = !text.includes('need tailor to buy fabric') && !text.includes('provide the fabric for me');

      // 7. Urgency & Turnaround
      let urgency: 'low' | 'normal' | 'high' = 'normal';
      let detectedTurnaroundDays = 7;

      if (text.includes('urgent') || text.includes('asap') || text.includes('tomorrow') || text.includes('2 days') || text.includes('3 days') || text.includes('emergency')) {
        urgency = 'high';
        detectedTurnaroundDays = 3;
      } else if (text.includes('next friday') || text.includes('next week') || text.includes('by friday')) {
        urgency = 'high';
        detectedTurnaroundDays = 5;
      } else if (text.includes('next month') || text.includes('no hurry')) {
        urgency = 'low';
        detectedTurnaroundDays = 14;
      }

      // 8. Key requirement tags
      const requirements: string[] = [];
      if (embroidery) requirements.push('Intricate Embroidery / Zardosi');
      if (text.includes('padding') || text.includes('padded')) requirements.push('Padded Cups');
      if (text.includes('piping') || text.includes('border')) requirements.push('Contrast Piping / Border');
      if (text.includes('tassel') || text.includes('latkan') || text.includes('dori')) requirements.push('Designer Latkans / Dori');
      if (text.includes('lining') || text.includes('cotton lining')) requirements.push('Pure Cotton Lining');
      if (text.includes('can-can') || text.includes('cancan')) requirements.push('Double Can-Can Netting');

      // 9. Suggested Budget calculation
      let minBudget = 600;
      let maxBudget = 1800;
      if (category === 'Bridal' || garmentType === 'Bridal Blouse') {
        minBudget = 1500;
        maxBudget = 3000;
      } else if (garmentType === 'Lehenga & Choli') {
        minBudget = 2500;
        maxBudget = 5500;
      } else if (garmentType === 'Bespoke Suit' || garmentType === 'Wedding Sherwani') {
        minBudget = 4500;
        maxBudget = 9000;
      } else if (garmentType === 'Custom Shirt' || garmentType === 'Formal Trousers') {
        minBudget = 500;
        maxBudget = 1200;
      }

      const extractedPayload = {
        garmentType,
        category,
        occasion,
        sleeveStyle,
        necklineStyle,
        fabricProvidedByCustomer,
        embroidery,
        urgency,
        detectedTurnaroundDays,
        requirements,
        suggestedBudget: {
          min: minBudget,
          max: maxBudget,
        },
      };

      // Strict validation through Zod
      return GarmentRequirementSchema.parse(extractedPayload);
    } catch (err) {
      console.warn('[AI Requirement Parser] Parsing error, falling back to safe defaults:', err);
      return GarmentRequirementSchema.parse({
        garmentType: 'Custom Garment',
        category: 'General',
        fabricProvidedByCustomer: true,
        urgency: 'normal',
        detectedTurnaroundDays: 7,
        requirements: [],
      });
    }
  }

  private async callGeminiAPI(promptText: string, apiKey: string): Promise<z.infer<typeof GarmentRequirementSchema> | null> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const systemPrompt = `You are an expert Indian bespoke tailoring assistant. Analyze the user's stitching requirement prompt and output strict JSON matching this schema:
{
  "garmentType": "string",
  "category": "Bridal" | "Women's Wear" | "Men's Wear" | "Kids" | "Alterations",
  "fabricProvidedByCustomer": true or false,
  "urgency": "normal" | "urgent" | "flexible",
  "detectedTurnaroundDays": number,
  "suggestedBudget": {
    "min": number or null,
    "max": number or null
  },
  "requirements": string[],
  "occasion": string or null
}
Return only valid JSON.`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\nUser requirement: "${promptText}"` }] }
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.1
        }
      })
    });

    if (!response.ok) {
      console.warn(`[AIMatchingService] Gemini API returned ${response.status}: ${response.statusText}`);
      return null;
    }

    const data: any = await response.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return GarmentRequirementSchema.parse({
      garmentType: parsed.garmentType || 'Custom Garment',
      category: parsed.category || 'General',
      fabricProvidedByCustomer: parsed.fabricProvidedByCustomer ?? true,
      urgency: parsed.urgency || 'normal',
      detectedTurnaroundDays: parsed.detectedTurnaroundDays || 7,
      requirements: Array.isArray(parsed.requirements) ? parsed.requirements : [],
      suggestedBudget: parsed.suggestedBudget ? {
        min: parsed.suggestedBudget.min ? Number(parsed.suggestedBudget.min) : null,
        max: parsed.suggestedBudget.max ? Number(parsed.suggestedBudget.max) : null,
      } : undefined,
    });
  }
}

export const aiMatchingService = new AIMatchingService();
