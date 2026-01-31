import { prisma } from './prisma';

/**
 * Generates starter code templates based on input/output definitions
 * @param questionId - The ID of the question
 * @param language - The programming language
 * @returns The starter code template for the specified language
 */
export async function generateStarterCodeFromInputOutput(questionId: string, language: string): Promise<string> {
  // Fetch the question with its input/output definitions
  const question = await prisma.question.findUnique({
    where: { id: questionId },
    include: {
      inputs: {
        orderBy: { order: 'asc' }
      },
      output: true
    }
  });

  if (!question) {
    throw new Error(`Question with ID ${questionId} not found`);
  }

  const { inputs, output, functionName } = question;

  // Convert Prisma enum values to language-specific types
  const convertType = (inputType: string, lang: string): string => {
    switch (inputType) {
      case 'INT':
        return lang === 'python' ? 'int' : 'int';
      case 'FLOAT':
        return lang === 'python' ? 'float' : 'double';
      case 'STRING':
        return lang === 'python' || lang === 'javascript' || lang === 'typescript' ? 'string' : 'String';
      case 'BOOLEAN':
        return lang === 'python' ? 'bool' : 'boolean';
      case 'INT_ARRAY':
        return lang === 'python' ? 'List[int]' : 'int[]';
      case 'FLOAT_ARRAY':
        return lang === 'python' ? 'List[float]' : 'double[]';
      case 'STRING_ARRAY':
        return lang === 'python' ? 'List[str]' : 'String[]';
      case 'BOOLEAN_ARRAY':
        return lang === 'python' ? 'List[bool]' : 'boolean[]';
      case 'INT_MATRIX':
        return lang === 'python' ? 'List[List[int]]' : 'int[][]';
      case 'STRING_MATRIX':
        return lang === 'python' ? 'List[List[str]]' : 'String[][]';
      default:
        return 'any';
    }
  };

  // Generate starter code based on the language
  switch (language.toLowerCase()) {
    case 'javascript':
    case 'typescript':
      // Prepare parameter list
      const jsParams = inputs.map(input => input.name).join(', ');
      
      // Prepare JSDoc comments
      const jsDocLines = [
        '/**',
        ...inputs.map(input => ` * @param {${convertType(input.type, 'javascript')}} ${input.name}`),
        ` * @return {${output ? convertType(output.type, 'javascript') : 'any'}}`,
        ' */'
      ];
      
      return `${jsDocLines.join('\n')}\nfunction ${functionName}(${jsParams}) {\n    // Write your code here\n}\n`;
    
    case 'python':
      // Prepare parameter annotations
      const pyAnnotations = inputs.map(input => `    ${input.name}: ${convertType(input.type, 'python')}`).join('\n');
      const pyReturnAnnotation = output ? ` -> ${convertType(output.type, 'python')}` : '';
      const pyParams = inputs.map(input => input.name).join(', ');
      
      return `from typing import ${getPythonTypes(inputs, output)}\n\ndef ${functionName}(${pyParams})${pyReturnAnnotation}:\n    # Write your code here\n    pass\n`;
    
    case 'java':
      // Determine return type
      const javaReturnType = output ? convertType(output.type, 'java') : 'void';
      
      // Determine parameter types
      const javaParams = inputs.map(input => `${convertType(input.type, 'java')} ${input.name}`).join(', ');
      
      return `class Solution {\n    public static ${javaReturnType} ${functionName}(${javaParams}) {\n        // Write your code here\n        return ${getDefaultReturnValue(output?.type || '')};\n    }\n}`;
    
    case 'cpp':
      // Determine return type
      const cppReturnType = convertType(output?.type || 'VOID', 'cpp') || 'void';
      
      // Determine parameter types (for C++, we need to handle array sizes differently)
      const cppParams = inputs.map(input => {
        // For C++, arrays might need special handling
        if (input.type.includes('_ARRAY')) {
          return `vector<${getTypeForCpp(input.type)}> ${input.name}`;
        }
        return `${convertType(input.type, 'cpp')} ${input.name}`;
      }).join(', ');
      
      return `#include <vector>\nusing namespace std;\n\n${cppReturnType} ${functionName}(${cppParams}) {\n    // Write your code here\n    return ${getDefaultReturnValue(output?.type || '')};\n}`;
    
    default:
      // Default to JavaScript-style for unknown languages
      const defaultParams = inputs.map(input => input.name).join(', ');
      return `function ${functionName}(${defaultParams}) {\n    // Write your code here\n}\n`;
  }
}

// Helper function to get Python import types
function getPythonTypes(inputs: any[], output: any | null): string {
  const types = new Set<string>();
  
  // Add types from inputs
  inputs.forEach(input => {
    const type = input.type;
    if (type.includes('_ARRAY') || type.includes('_MATRIX')) {
      types.add('List');
    }
  });
  
  // Add type from output
  if (output && (output.type.includes('_ARRAY') || output.type.includes('_MATRIX'))) {
    types.add('List');
  }
  
  return Array.from(types).join(', ') || 'Any';
}

// Helper function to get C++ specific types
function getTypeForCpp(type: string): string {
  switch (type) {
    case 'INT_ARRAY':
    case 'INT_MATRIX':
      return 'int';
    case 'STRING_ARRAY':
    case 'STRING_MATRIX':
      return 'string';
    case 'FLOAT_ARRAY':
    case 'FLOAT_MATRIX':
      return 'double';
    case 'BOOLEAN_ARRAY':
      return 'bool';
    default:
      return 'int'; // default
  }
}

// Helper function to get default return values
function getDefaultReturnValue(type: string): string {
  switch (type) {
    case 'INT':
    case 'FLOAT':
      return '0';
    case 'STRING':
      return '""';
    case 'BOOLEAN':
      return 'false';
    case 'INT_ARRAY':
    case 'FLOAT_ARRAY':
    case 'STRING_ARRAY':
    case 'BOOLEAN_ARRAY':
      return '{}';
    case 'INT_MATRIX':
    case 'STRING_MATRIX':
      return '{}';
    default:
      return 'null';
  }
}

/**
 * This function is kept for backward compatibility
 * @deprecated Use generateStarterCodeFromInputOutput instead
 */
export async function generateStarterCodeFromTestCases(questionId: string, language: string): Promise<string> {
  return generateStarterCodeFromInputOutput(questionId, language);
}