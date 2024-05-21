import fs from 'fs';
import path from 'path';
import { sendOllamaStatusToRenderer } from '..';
import { MOR_PROMPT } from './prompts';
import { perform_skill, fix_skill, create_skill, getSkills } from './do/skills';
import { z } from 'zod';
// Define the type for an expert
type Expert = {
  version: string;
  prompt: string;
};

// Directory to store expert JSON files
const expertsDir = path.join(__dirname, './experts');

// Ensure the directory exists
if (!fs.existsSync(expertsDir)) {
  fs.mkdirSync(expertsDir);
}

// Load all experts
const loadExperts = (): Record<string, Expert> => {
  const experts: Record<string, Expert> = {};
  const files = fs.readdirSync(expertsDir);

  files.forEach((file) => {
    if (file.endsWith('.json')) {
      const filePath = path.join(expertsDir, file);
      const data = fs.readFileSync(filePath, 'utf8');
      const expert = JSON.parse(data);
      const expertName = path.basename(file, '.json');
      experts[expertName] = expert;
    }
  });

  return experts;
};

// Save an expert to a JSON file
const saveExpert = (expertName: string, expert: Expert) => {
  const filePath = path.join(expertsDir, `${expertName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(expert, null, 2), 'utf8');
};

// Export the loaded experts
export let experts = loadExperts();

// Add a new expert
export const addExpert = (expertName: string, version: string, prompt: string) => {
  const newExpert = { version, prompt };
  experts[expertName] = newExpert;
  saveExpert(expertName, newExpert);
};

// Remove an expert
export const removeExpert = (expertName: string) => {
  delete experts[expertName];
  const filePath = path.join(expertsDir, `${expertName}.json`);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

// Ask all experts
export const askExperts = async (ollama: any, message: string) => {
  try {
    // TODO load experts
    // highest semantic version for each expert
    console.log('ollama: ', ollama);
    console.log('message: ', message);

    let experts: any = [];
    let expertMap: any = [];

    // Morpheus expert setup
    let Morpheus = {
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: MOR_PROMPT,
        },
        {
          role: 'user',
          content: `Answer the following query in a valid formatted JSON object without comments with both the response and action fields deduced from the user's question. Adhere strictly to JSON syntax without comments. Query: ${message}. Response: { "response":`,
        },
      ],
    };
    experts.push(Morpheus);
    expertMap.push('Morpheus');

    // Praxeus expert setup
    let system = `You are Praxeus, a bot that knows how to "do things". You build, index, create, and run skills. Skills are JSON objects with the structure

        interface ACTION {
            name: 'skill name',
            inputs: ['', {}, and optional],
            script: 'a stringified bash script that is written to file and executed',
            outputs: {
                ''
            },
        }

        your toolbelt object

        {
            refreshSkills(): function, no inputs, 'reloads skills from the directory',
            getSkills(): function, no inputs, 'outputs loaded skills',
            performSkill(): function, inputs: {skill: 'skill name', input: 'input', output: 'output', context: 'context'}, 'performs a skill',
            createSkill(): function, inputs: {skill: 'skill name', input: 'input', output: 'output', context: 'context'}, 'creates a skill',
        }

        you always return in the format

        {
            response: 'response as a string on what you are doing and why',
            action: {
                type: 'function name',
                inputs: ['', {}, and optional],
                script: 'a stringified bash script that is written to file and executed',
            }
        }`;

    let Praxeus = {
      model: 'llama2',
      messages: [
        {
          role: 'system',
          content: system,
        },
        {
          role: 'user',
          content: `Answer the following query in a valid formatted JSON object without comments with both the response and action fields deduced from the user's question. Adhere strictly to JSON syntax without comments. Query: ${message}. Response: { "response":`,
        },
      ],
    };

    // experts.push(Praxeus);
    // expertMap.push('Praxeus');

    console.log('experts: ', experts);

    const promises = experts.map((expert: any) => ollama.chat(expert));
    const results = await Promise.all(promises);
    console.log('results: ', results);

    // Define the schema for the expected JSON response
    const ScriptResponseSchema = z.object({
      response: z.string(),
      action: z
        .object({
          type: z.string(),
          inputs: z.array(z.any()).optional(),
          script: z.string().optional(),
        })
        .optional(),
    });

    results.forEach((result: any, index: any) => {
      let response;
      try {
        response = JSON.parse(result.message.content);
        // Validate the response using Zod schema
        ScriptResponseSchema.parse(response);
        console.log(`*** ${expertMap[index]} response: `, response);
      } catch (e) {
        if (e instanceof z.ZodError) {
          console.error(`*** ${expertMap[index]}: Invalid response schema: `, e.errors);
        } else {
          console.error(`*** ${expertMap[index]}: Invalid response: `, response);
        }
      }
    });

    return results[0];
  } catch (e) {
    console.error(e);
    throw e;
  }
};
