let TAG = ' | AI | ';

import { z } from 'zod';
import os from 'os';
const log = require('@pioneer-platform/loggerdog')();
let ai = require('@pioneer-platform/pioneer-ollama');
// ai.init('llama3')
ai.init('dolphin-mixtral:latest');

module.exports = {
  buildScript: function (objective: string, input: string, output: string, context: any) {
    return build_a_script(objective, input, output, context);
  },
  //skill creation
  fixScript: function (script: string, issue: string, context: any) {
    return fix_a_script(script, issue, context);
  },
};

// Define the schema for the expected JSON response
const ScriptResponseSchema = z.object({
  scriptName: z.string(),
  inputs: z.array(z.any()),
  script: z.string(),
  outputs: z.array(z.string()),
  context: z.string().optional(),
});

let build_a_script = async function (
  objective: string,
  input: string,
  output: string,
  context: any,
) {
  let tag = TAG + ' | build_a_script | ';
  try {
    const userRequestContent = `create a bash script with objective: '${objective}', inputs: '${input}', outputs: '${output}', context: '${JSON.stringify(context)}'`;

    let prompt = `Generate responses in strict JSON format. 
        Include a 
            'scriptName', 
            'script', 
            'inputs': [param1, param2, param3....]. (params are optional) 
            
            Ensure all string values are enclosed in double quotes, no trailing commas, and no comments. 
            
       Example: 
       
       input: write a script that pings google
       output:
      
       {
            "scriptName": "exampleScript.sh",
            "inputs": [],
            "script": "*the string of your generated script, it will be printed directly to a file with fs.writeFileSync*",
            "outputs": ["Ping to Google was successful."],
            "context": ""
        }`;

    let messages: any = [
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'system',
        content:
          'Bash Scripts are always written for ' +
          os.platform() +
          ' and ' +
          os.arch() +
          ' architecture',
      },
      {
        role: 'user',
        content: userRequestContent,
      },
    ];

    let response = await ai.respond(messages);
    // log.info(tag, "response: ", response)
    try {
      response = JSON.parse(response);
      // Validate the response using Zod schema
      ScriptResponseSchema.parse(response);
      log.info(tag, 'content: ', response);
      log.info(tag, 'content: ', typeof response);
      log.info(tag, 'content: ', Object.keys(response));
    } catch (e) {
      if (e instanceof z.ZodError) {
        log.error(tag, 'Invalid response schema: ', e.errors);
      } else {
        log.error(tag, 'Invalid response: ', response);
        log.error('Modal pretend invalid JSON: ', response.length);
      }
      throw e;
    }

    // validate scheme
    if (!response.scriptName) throw Error('missing scriptName');
    if (!response.script) throw Error('missing response');

    return response;
  } catch (e) {
    log.error(tag, 'e: ', e);
    throw e;
  }
};

let fix_a_script = async function (script: string, issue: string, context: any) {
  let tag = TAG + ' | fix_a_script | ';
  try {
    let prompt = `Generate responses in strict JSON format. 
        Include a 
            'scriptName', 
            'script', 
            'inputs': [param1, param2, param3....]. (params are optional) 
            
            Ensure all string values are enclosed in double quotes, no trailing commas, and no comments. 
            
       Example: 
       
       input: write a script that pings google
       output:
      
       {
            "scriptName": "exampleScript.sh",
            "inputs": [],
            "script": "*the string of your generated script, it will be printed directly to a file with fs.writeFileSync*",
            "outputs": ["Ping to Google was successful."],
            "context": ""
        }`;

    let messages = [
      {
        role: 'system',
        content:
          'You are a bash script fixer bot. you write bash scripts that leverage all programming languages and clis you know about. you find common code that does usefull things and wrap them in bash scripts. you build these bashscript to format the inputs and outputs into json. if you cant find a cli that does what is asked you write it yourself.',
      },
      {
        role: 'system',
        content: prompt,
      },
      {
        role: 'system',
        content:
          'Bash Scripts are always written for ' +
          os.platform() +
          ' and ' +
          os.arch() +
          ' architecture',
      },
      {
        role: 'user',
        content: 'this is the script you are fixing: ' + script,
      },
      {
        role: 'user',
        content: 'the issue with script is: ' + JSON.stringify(issue),
      },
      {
        role: 'user',
        content: 'extra context: ' + context,
      },
    ];

    let response = await ai.respond(messages);
    // log.info(tag, "response: ", response)
    try {
      response = JSON.parse(response);
      // Validate the response using Zod schema
      ScriptResponseSchema.parse(response);
      log.info(tag, 'content: ', response);
      log.info(tag, 'content: ', typeof response);
      log.info(tag, 'content: ', Object.keys(response));
    } catch (e) {
      if (e instanceof z.ZodError) {
        log.error(tag, 'Invalid response schema: ', e.errors);
      } else {
        log.error(tag, 'Invalid response: ', response);
        log.error('Modal pretend invalid JSON: ', response.length);
      }
      throw e;
    }

    // validate scheme
    if (!response.scriptName) throw Error('missing scriptName');
    if (!response.script) throw Error('missing response');

    return response;
  } catch (e) {
    log.error(tag, 'e: ', e);
    throw e;
  }
};
