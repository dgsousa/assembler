const fs = require('fs');

const symbolTable = {
  SP: '0',
  LCL: '1',
  ARG: '2',
  THIS: '3',
  THAT: '4',
  R0: '0',
  R1: '1',
  R2: '2',
  R3: '3',
  R4: '4',
  R5: '5',
  R6: '6',
  R7: '7',
  R8: '8',
  R9: '9',
  R10: '10',
  R11: '11',
  R12: '12',
  R13: '13',
  R14: '14',
  R15: '15',
  SCREEN: '16384',
  KBD: '24576'
}

const jumpTable = {
  'JGT': '001',
  'JEQ': '010',
  'JGE': '011',
  'JLT': '100',
  'JNE': '101',
  'JLE': '110',
  'JMP': '111'
}

const destTable = {
  'M': '001',
  'D': '010',
  'MD': '011',
  'A': '100',
  'AM': '101',
  'AD': '110',
  'AMD': '111'
}

const compTable = {
  '0': '0101010',
  '1': '0111111',
  '-1': '0111010',
  'D': '0001100',
  'A': '0110000',
  '!D': '0001101',
  '!A': '0110001',
  '-D': '0001111',
  '-A': '0110011',
  'D+1': '0011111',
  'A+1': '0110111',
  'D-1': '0001110',
  'A-1': '0110010',
  'D+A': '0000010',
  'D-A': '0010011',
  'A-D': '0000111',
  'D&A': '0000000',
  'D|A': '0010101',
  'M': '1110000',
  '!M': '1110001',
  '-M': '1110011',
  'M+1': '1110111',
  'M-1': '1110010',
  'D+M': '1000010',
  'D-M': '1010011',
  'M-D': '1000111',
  'D&M': '1000000',
  'D|M': '1010101'
}

function formatFileContents(contentArray) {
  return contentArray
    .filter(line => !isComment(line) && !isBlankLine(line))
    .map(removeWhitespaceAndComments);
}

function firstPass(instructionArray) {
  let counter = 0;
  return instructionArray.filter(line => {
    if(line[0] === '(') {
      const symbol = line.substring(1, line.length-1);
      symbolTable[symbol] = counter;
      return false;
    } else {
      counter++;
      return true;
    }
  });
}


function secondPass(instructionArray) {
  let nextVarAddress = 16;
  return instructionArray.map(line => {
    if(line[0] === '@') {
      const val = line.substring(1, line.length);
      if(val === '0') return convertToBinary(val);
      else if(Number(val)) return convertToBinary(Number(val));
      else if(symbolTable[val]) return convertToBinary(symbolTable[val]);
      else {
        const address = convertToBinary(nextVarAddress);
        symbolTable[val] = nextVarAddress; 
        nextVarAddress++;
        return address;
      } 
    } else {
      return parseCommand(line);
    }
  })
}

// helper functions
function isComment(line) {
	return line.substring(0, 2) === '//';
}

function isBlankLine(line) {
	const newLine = line
		.split('')
		.filter(char => char !== '' && char !== ' ' && char !== '\r')
	return newLine.length === 0;
}

function removeWhitespaceAndComments(line) {
	let counter = 0;
	let formatted = '';
	const splitLine = line.split('');
	while(splitLine[counter] === '' || splitLine[counter] === ' ') {
		counter++;
	}
	while(
		splitLine[counter] && 
		splitLine[counter] !== ' ' && 
		splitLine[counter] !== '/' &&
		splitLine[counter] !== '\r') {
		formatted += splitLine[counter];
		counter++;
	}
	return formatted;
}

function convertToBinary(num) {
  let remainder = num;
  let binaryString = '';
  for(let i = 0; i < 16; i++) {
    currentDigit = Math.pow(2, 15 - i);
    if(remainder >= currentDigit) {
      binaryString += '1';
      remainder -= currentDigit;
    } else {
      binaryString += '0';
    }
  }
  return binaryString;
}

function parseCommand(cmd) {
  let dest = '';
  let jump = '';
  let comp = '';
  let rest = cmd;
  if(cmd.indexOf('=') > -1) {
    const cmdArr = cmd.split('=');
    dest = cmdArr[0];
    comp = cmdArr[1];
    rest = cmdArr[1];
  }
  if(rest.indexOf(';') > -1) {
    const restArr = rest.split(';');
    comp = restArr[0];
    jump = restArr[1];
  }
  return [
    '111',
    compTable[comp],
    destTable[dest] || '000',
    jumpTable[jump] || '000'
  ].join('');
};

function getFileToWrite(fileName) {
  const fileNameArray = fileName.split('.');
  const path = fileNameArray[0];
  return `${path}.hack`;
}

function writeFile(file, instructions) {
  const fileStream = fs.createWriteStream(file);
  instructions.forEach(line => {
    fileStream.write(line + '\n');
  })
  fileStream.end();
}

function main() {
  const fileToRead = process.argv[2];
  const fileToWrite = getFileToWrite(fileToRead);
  const fileContents = fs.readFileSync(fileToRead, 'utf8');
  const contentArray = fileContents.split('\n');
  const formattedFileContents = formatFileContents(contentArray);
  const instructions = secondPass(firstPass(formattedFileContents));
  writeFile(fileToWrite, instructions);
}

main();
