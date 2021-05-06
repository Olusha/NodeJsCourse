const { program } = require('commander');
const readline  = require('readline');
const fs = require('fs');

const ACTION = {
    DECODE: 'decode',
    ENCODE: 'encode'
};

const PATTERN = new RegExp(/^[a-zA-Z]*$/);


program.option('-s, --shift <shift>', 'shift')
    .option('-a, --action <action>', 'encode/decode')
    .option('-i, --input <path>', 'input file')
    .option('-o, --output <path>', 'output file');


program.parse(process.argv);

const options = program.opts();
const shift = +options.shift;

validate(options.action, shift, options.input, options.output);

if(!!options.input) {
    const text = fs.readFileSync(options.input, 'utf8');
    const result = handle(text, +options.shift, options.action);

    writeResult(result);
} else {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });


    rl.question(`Please, enter text to ${options.action}:  `, (answer) => {
        const result = handle(answer, +options.shift, options.action);
        writeResult(result);
        rl.close();
    });
}

function handle(value, shift, action) {
    let split = value.split('');
    const ranges = {
        lower: {from: 'a'.charCodeAt(0), to: 'z'.charCodeAt(0)},
        upper: {from: 'A'.charCodeAt(0), to: 'Z'.charCodeAt(0)},
    };

    const fn =  action===ACTION.DECODE ? decode : encode;

    split = split.map(letter => {
        if(PATTERN.test(letter)) {
            const code = letter.charCodeAt(0);
            const isLower = code>=ranges.lower.from && code<=ranges.lower.to;
            const range = isLower ? ranges.lower : ranges.upper;

            const newCode = fn(code, shift, range);

            letter = String.fromCharCode(newCode);
        }

        return letter;
    });

    return split.join('');
}


function encode(code, shift, range) {
    if(code+shift > range.to) {

        shift = shift + code - range.to - 1;
        code = range.from;

        return  shift  > 0 ? encode(code, shift, range) : code;
    }

    code= code + shift;

    return code;
}

function decode(code, shift, range) {
    if(code-shift < range.from) {

        shift = shift - (code - range.from) - 1;
        code = range.to;

        return  shift  > 0 ? decode(code, shift, range) : code;
    }

    code= code - shift;

    return code;
}


function writeResult(value) {
    if(!!options.output) {
        fs.writeFileSync(options.output, value, 'utf8');

        return;
    }

   process.stdout.write(`${options.action}d: ${value}\n`);
}

function validate(action, shiftV, input, output) {
    if(!action || !Object.values(ACTION).includes(action)) {
        throw new Error('Please, provide correct action')
    }

    if(!shiftV || !(typeof(shiftV) ==='number') || shiftV < 1) {
        throw new Error('Please, provide correct shift')
    }

    if(!!input && !fs.existsSync(input)) {
        throw new Error('Pleas,provide correct path to the input file')
    }
}
